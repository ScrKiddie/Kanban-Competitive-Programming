import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FieldLabel } from "@/components/ui/field-label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DIFFICULTY_LABELS, PLATFORM_LABELS, STATUS_LABELS } from "@/lib/constants";
import { Difficulty, Platform, Problem, Status, difficulties, platforms, statuses } from "@/lib/types";
import { slugify } from "@/lib/slug";
import { parseProblemUrl } from "@/lib/url-parser";
import { safeDate } from "@/lib/utils";
import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/lib/api-client";
import { canTransitionProblem } from "@/lib/problem-workflow";
import { openExternalUrl } from "@/lib/open-external-url";

export function DetailPanel({
  problem,
  onClose,
  onUpdate,
  onDelete
}: {
  problem: Problem | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Problem>) => void;
  onDelete: (id: string) => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<Platform>("leetcode");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [status, setStatus] = useState<Status>("backlog");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [titleError, setTitleError] = useState("");
  const scrapeAbortRef = useRef<AbortController | null>(null);

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (problem) {
      scrapeAbortRef.current?.abort();
      scrapeAbortRef.current = null;
      setIsScraping(false);
      setActiveProblem(problem);
      setTitle(problem.title);
      setUrl(problem.url);
      setPlatform(problem.platform);
      setDifficulty(problem.difficulty);
      setStatus(problem.status);
      setNote(problem.note ?? "");
      setTags(problem.tags ?? []);
      setTagInput("");
      setTitleError("");
      setHasChanges(false);
      setIsOpen(true);
    } else {
      scrapeAbortRef.current?.abort();
      scrapeAbortRef.current = null;
      setIsScraping(false);
      setIsOpen(false);
    }
  }, [problem]);

  useEffect(() => {
    return () => scrapeAbortRef.current?.abort();
  }, []);

  const handleSave = () => {
    if (!activeProblem) return;

    const nextTitleError = !title.trim() ? "title is required" : "";
    if (nextTitleError) {
      setTitleError(nextTitleError);
      return;
    }

    const tempProblem = {
      ...activeProblem,
      title: title.trim(),
      url: url.trim(),
      note: note.trim()
    };

    const transition = canTransitionProblem(tempProblem, status);
    if (!transition.ok) {
      toast.error(transition.reason, {
        description: transition.description,
      });
      return;
    }

    onUpdate(activeProblem.id, {
      title: title.trim(),
      slug: slugify(title.trim()),
      url: url.trim(),
      platform,
      difficulty,
      status,
      note: note.trim(),
      tags
    });

    toast.success("Problem updated successfully");
    setHasChanges(false);
  };

  const handleScrapeProblem = async () => {
    if (!problem?.url) {
      toast.error("URL unavailable", { description: "Please fill problem URL first" });
      return;
    }

    scrapeAbortRef.current?.abort();
    const controller = new AbortController();
    scrapeAbortRef.current = controller;
    setIsScraping(true);
    try {
      const data = await api.scrape(problem.url, controller.signal);
      if (controller.signal.aborted) return;

      if (data.description || data.title) {
        const patch: Partial<Problem> = {};
        
        if (data.title && problem.title === "New Problem") {
          patch.title = data.title;
          patch.slug = slugify(data.title);
        } else if (data.title && problem.title !== data.title) {
          patch.title = data.title;
          patch.slug = slugify(data.title);
        }

        if (data.platform && (platforms as readonly string[]).includes(data.platform)) {
          patch.platform = data.platform as Platform;
        }

        if (data.difficulty && difficulties.includes(data.difficulty as Difficulty)) {
          patch.difficulty = data.difficulty as Difficulty;
        }

        if (data.description) {
          const newNote = note ? `${data.description}\n\n---\n\n${note}` : data.description;
          setNote(newNote);
          patch.note = newNote;
        }
        
        if (data.tags?.length) {
          const merged = [...new Set([...tags, ...data.tags])];
          setTags(merged);
          patch.tags = merged;
        }
        
        if (Object.keys(patch).length > 0) {
          onUpdate(problem.id, patch);
        }
        
        toast.success("Successfully fetched problem data from URL");
      } else {
        toast.error("Failed", { description: "Data not found at the URL" });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Scraping error:", error);
      toast.error("Failed to fetch data", { description: error instanceof Error ? error.message : "Try manual input instead" });
    } finally {
      if (scrapeAbortRef.current === controller) {
        scrapeAbortRef.current = null;
        setIsScraping(false);
      }
    }
  };

  if (!activeProblem) return null;

  const isReadOnly = activeProblem.status !== "backlog";
  const sourceHref = url ? (/^https?:\/\//i.test(url) ? url : `https://${url}`) : "";

  const handleClose = () => {
    scrapeAbortRef.current?.abort();
    scrapeAbortRef.current = null;
    setIsScraping(false);
    onClose();
  };

  return (
    <>
      <Modal
        open={isOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleClose();
          }
        }}
        title="Edit Problem"
        className="sm:max-w-4xl h-[85vh]"
        contentClassName="flex flex-col overflow-hidden p-0"
        scrollable={false}
      >
        <ScrollArea className="flex-1 min-h-0 w-full bg-background">
          <div className="p-6 pr-7">
              {isReadOnly && (
                <div className="mb-6">
                  <Alert className="bg-yellow-400 text-black border-border">
                    <Info className="size-4" />
                    <AlertTitle>Read Only</AlertTitle>
                    <AlertDescription>
                      Problem details can only be edited when the status is Backlog. Please change the status back to Backlog from the Kanban Board if you want to make changes.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="detail-url">Problem URL</Label>
                <div className="flex gap-2">
                  <Input 
                    className="flex-1"
                    id="detail-url" 
                    value={url} 
                    placeholder="paste leetcode or any problem link" 
                    disabled={isReadOnly}
                    onChange={(event) => {
                      const value = event.target.value;
                      const parsed = parseProblemUrl(value);
                      setUrl(value);
                      if (value && parsed.platform) {
                        setPlatform(parsed.platform);
                      }
                      setHasChanges(true);
                    }} 
                  />
                  <IconButton
                    size="xl"
                    className="shrink-0"
                    onClick={handleScrapeProblem}
                    disabled={isScraping || !url || isReadOnly}
                    tooltip="Auto-fetch problem data"
                  >
                    {isScraping ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                  </IconButton>
                  {sourceHref ? (
                    <Button
                      size="icon"
                      variant="default"
                      className="size-10 shrink-0"
                      tooltip="Open source link"
                      onClick={() => void openExternalUrl(sourceHref)}
                      aria-label="Open source link"
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="md:col-span-2 my-2 flex items-center gap-4">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">or fill manually</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              <div className="md:col-span-2">
                <FieldLabel htmlFor="detail-title" required>Title</FieldLabel>
                <Input 
                  id="detail-title"
                  value={title} 
                  placeholder="two sum"
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (titleError) setTitleError("");
                    setHasChanges(true);
                  }} 
                  disabled={isReadOnly}
                  className={titleError ? "border-danger" : ""}
                  aria-invalid={Boolean(titleError)}
                  aria-describedby={titleError ? "detail-title-error" : undefined}
                />
                <FieldError id="detail-title-error" className="mt-2">{titleError}</FieldError>
              </div>

              <div>
                <Label>Platform</Label>
                <Select 
                  disabled={isReadOnly} 
                  value={["leetcode", "codewars", "hackerrank", "codeforces"].includes(platform) ? platform : "custom"} 
                  onValueChange={(value) => {
                    setPlatform(value as Platform);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>)}
                  </SelectContent>
                </Select>
                {!["leetcode", "codewars", "hackerrank", "codeforces"].includes(platform) && (
                  <div className="mt-2">
                    <Input
                      placeholder="e.g. AtCoder"
                      value={platform === "custom" ? "" : platform}
                      disabled={isReadOnly}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPlatform(val || "custom");
                        setHasChanges(true);
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Difficulty</Label>
                <Select 
                  disabled={isReadOnly} 
                  value={difficulty} 
                  onValueChange={(value) => {
                    setDifficulty(value as Difficulty);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((d) => <SelectItem key={d} value={d}>{DIFFICULTY_LABELS[d]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select 
                  disabled={true} 
                  value={status} 
                  onValueChange={(value) => {
                    setStatus(value as Status);
                    setHasChanges(true);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((statusItem) => {
                      const transition = canTransitionProblem(activeProblem, statusItem);
                      return (
                        <SelectItem key={statusItem} value={statusItem} disabled={!transition.ok}>
                          {STATUS_LABELS[statusItem]}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Timestamps</Label>
                <Card className="gap-2 bg-secondary-background p-4 text-sm">
                  <div className="flex items-center justify-between gap-4 border-b-2 border-border pb-2">
                    <span className="font-heading">created</span>
                    <span className="text-right font-base">{safeDate(activeProblem.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-heading">updated</span>
                    <span className="text-right font-base">{safeDate(activeProblem.updatedAt)}</span>
                  </div>
                </Card>
              </div>
            </div>

              <div className="md:col-span-2 mt-4">
                <Label>Tags</Label>
                
                {!isReadOnly && (
                  <div className="flex gap-2 mb-3">
                    <Input 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = tagInput.trim().toLowerCase();
                          if (val && !tags.includes(val)) {
                            setTags([...tags, val]);
                            setTagInput("");
                            setHasChanges(true);
                          }
                        }
                      }}
                      placeholder="Add tag and press Enter"
                      className="flex-1"
                    />
                    <Button 
                      size="icon"
                      variant="default" 
                      onClick={() => {
                        const val = tagInput.trim().toLowerCase();
                        if (val && !tags.includes(val)) {
                          setTags([...tags, val]);
                          setTagInput("");
                          setHasChanges(true);
                        }
                      }}
                      disabled={!tagInput.trim()}
                      className="size-10 shrink-0"
                      tooltip="Add tag"
                      aria-label="Add tag"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="default"
                        className="font-medium gap-1"
                      >
                        {tag}
                        {!isReadOnly && (
                          <button
                            type="button"
                            className="ml-0.5 cursor-pointer text-[var(--main-foreground)]/50 hover:text-[var(--main-foreground)]"
                            onClick={() => {
                              const next = tags.filter((t) => t !== tag);
                              setTags(next);
                              setHasChanges(true);
                            }}
                          >
                            ×
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">No tags yet.</p>
                )}
              </div>

              <div className="mt-6">
                <Label htmlFor="detail-note">Description / Notes</Label>
                <Textarea
                  value={note}
                  placeholder="Paste problem description here, or auto-fetch from URL, then add your insights/notes..."
                  onChange={(event) => {
                    if (isReadOnly) return;
                    const nextValue = event.target.value;
                    setNote(nextValue);
                    setHasChanges(true);
                  }}
                  id="detail-note"
                  className="min-h-[200px]"
                  disabled={isReadOnly}
                />
              </div>
          </div>
        </ScrollArea>

              {!isReadOnly && (
                <div className="flex shrink-0 border-t-2 border-border bg-background p-6">
                  <Button 
                    onClick={handleSave} 
                    disabled={!hasChanges}
                    className="w-full"
                  >
                    Save Changes
                  </Button>
                </div>
              )}
      </Modal>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>delete this problem</AlertDialogTitle>
            <AlertDialogDescription>
              this action cannot be undone and will delete the problem data from local storage
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-[var(--danger)] text-[var(--danger-foreground)] hover:bg-[var(--danger)]" onClick={() => {
              onDelete(activeProblem.id)
              setDeleteOpen(false)
              onClose()
            }}>
              delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
