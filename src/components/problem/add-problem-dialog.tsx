import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FieldLabel } from "@/components/ui/field-label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIFFICULTY_LABELS, PLATFORM_LABELS } from "@/lib/constants";
import { Difficulty, Platform, ProblemDraft, Status, difficulties, platforms } from "@/lib/types";
import { parseProblemUrl } from "@/lib/url-parser";
import { validateTitle } from "@/lib/validators";
import { api } from "@/lib/api-client";
import { openExternalUrl } from "@/lib/open-external-url";
import { CatalogExplorer } from "./catalog-explorer";

const defaultDraft: ProblemDraft = {
  title: "",
  url: "",
  platform: "custom",
  difficulty: "unknown",
  status: "backlog",
  note: "",
  tags: [],
};

interface AddProblemDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (draft: ProblemDraft) => void;
  onCreateBulk: (drafts: ProblemDraft[]) => void;
}

export function AddProblemDialog({
  open,
  onClose,
  onCreate,
  onCreateBulk,
}: AddProblemDialogProps) {
  const [tab, setTab] = useState<"manual" | "explorer">("manual");
  const [draft, setDraft] = useState<ProblemDraft>(defaultDraft);
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof ProblemDraft, string>>>({});
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const metadataAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(defaultDraft);
      setTagInput("");
      setErrors({});
      setTab("manual");
    } else {
      metadataAbortRef.current?.abort();
      metadataAbortRef.current = null;
      setLoadingMetadata(false);
    }
  }, [open]);

  useEffect(() => {
    return () => metadataAbortRef.current?.abort();
  }, []);

  const sourceHref = draft.url ? (/^https?:\/\//i.test(draft.url) ? draft.url : `https://${draft.url}`) : "";

  const handleUrlChange = (url: string) => {
    setDraft((prev) => ({ ...prev, url }));
    const parsed = parseProblemUrl(url);
    if (parsed.platform !== "custom") {
      setDraft((prev) => ({ ...prev, platform: parsed.platform }));
    }
  };

  const fetchMetadata = async () => {
    if (!draft.url) return;
    metadataAbortRef.current?.abort();
    const controller = new AbortController();
    metadataAbortRef.current = controller;
    setLoadingMetadata(true);
    try {
      const res = await api.scrape(draft.url, controller.signal);
      if (controller.signal.aborted) return;
      if (!res.error) {
        setDraft((prev) => ({
          ...prev,
          title: res.title || prev.title,
          platform: res.platform || prev.platform,
          difficulty: res.difficulty || prev.difficulty,
          note: res.note || res.description || prev.note,
          tags: res.tags || prev.tags || [],
        }));
        toast.success("Problem details fetched");
      } else {
        toast.error("Failed to fetch details");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Error fetching details");
    } finally {
      if (metadataAbortRef.current === controller) {
        metadataAbortRef.current = null;
        setLoadingMetadata(false);
      }
    }
  };

  const handleCreate = () => {
    const titleError = validateTitle(draft.title);
    if (titleError) {
      setErrors({ title: titleError });
      return;
    }

    onCreate(draft);
    onClose();
    toast.success("Problem added");
  };

  const handleClose = () => {
    metadataAbortRef.current?.abort();
    metadataAbortRef.current = null;
    setLoadingMetadata(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onOpenChange={(val) => !val && handleClose()}
      title="Add Problem"
      className="sm:max-w-4xl h-[85vh]"
      contentClassName="p-0"
      scrollable={false}
    >
        <Tabs value={tab} onValueChange={(val) => setTab(val as "manual" | "explorer")} className="flex flex-col flex-1 min-h-0 w-full overflow-hidden">
          <div className="p-4 sm:p-6 pb-2 shrink-0 bg-background">
            <TabsList className="flex w-full items-stretch justify-between p-1 bg-secondary-background border-2 border-border shadow-[4px_4px_0px_0px_var(--border)] rounded-base h-auto gap-1">
              <TabsTrigger 
                value="manual" 
                className="group flex-1 py-2 px-1.5 flex items-center justify-center font-heading border-2 border-transparent rounded-base transition-all select-none data-[state=active]:border-border data-[state=active]:bg-main data-[state=active]:text-black"
              >
                Manual
              </TabsTrigger>
              <TabsTrigger 
                value="explorer" 
                className="group flex-1 py-2 px-1.5 flex items-center justify-center font-heading border-2 border-transparent rounded-base transition-all select-none data-[state=active]:border-border data-[state=active]:bg-main data-[state=active]:text-black"
              >
                Catalog Explorer
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="manual" className="flex-1 overflow-hidden px-6 bg-background m-0 border-none outline-none focus-visible:ring-0">
            <ScrollArea className="h-full pr-4" viewportClassName="[&>div]:!block">
              <div className="flex flex-col gap-5 pb-6 px-3 pt-3">
                <div className="flex flex-col gap-2">
                  <Label>Problem URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://leetcode.com/problems/..."
                      value={draft.url}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className="flex-1"
                    />
                    <IconButton 
                      size="xl"
                      className="shrink-0"
                      onClick={fetchMetadata}
                      disabled={!draft.url || loadingMetadata}
                      tooltip="Auto-fetch problem data"
                    >
                      {loadingMetadata ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
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

                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="add-problem-title" required>Title</FieldLabel>
                  <Input
                    id="add-problem-title"
                    placeholder="Two Sum"
                    value={draft.title}
                    onChange={(e) => {
                      setDraft((prev) => ({ ...prev, title: e.target.value }));
                      if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
                    }}
                    className={errors.title ? "border-danger" : ""}
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errors.title ? "add-problem-title-error" : undefined}
                  />
                  <FieldError id="add-problem-title-error">{errors.title}</FieldError>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Platform</Label>
                    <Select
                      value={["leetcode", "codewars", "hackerrank", "codeforces"].includes(draft.platform) ? draft.platform : "custom"}
                      onValueChange={(val: Platform) => setDraft((prev) => ({ ...prev, platform: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((p) => (
                          <SelectItem key={p} value={p}>
                            {PLATFORM_LABELS[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Difficulty</Label>
                    <Select
                      value={draft.difficulty}
                      onValueChange={(val: Difficulty) => setDraft((prev) => ({ ...prev, difficulty: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {difficulties.map((d) => (
                          <SelectItem key={d} value={d}>
                            {DIFFICULTY_LABELS[d]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!["leetcode", "codewars", "hackerrank", "codeforces"].includes(draft.platform) && (
                  <div className="flex flex-col gap-2">
                    <Label>Custom Platform Name</Label>
                    <Input
                      placeholder="e.g. AtCoder"
                      value={draft.platform === "custom" ? "" : draft.platform}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((prev) => ({ ...prev, platform: val || "custom" }));
                      }}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = tagInput.trim().toLowerCase();
                          if (val && !draft.tags?.includes(val)) {
                            setDraft(prev => ({ ...prev, tags: [...(prev.tags || []), val] }));
                            setTagInput("");
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
                        if (val && !draft.tags?.includes(val)) {
                          setDraft(prev => ({ ...prev, tags: [...(prev.tags || []), val] }));
                          setTagInput("");
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
                  {draft.tags && draft.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {draft.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="default"
                          className="font-medium gap-1"
                        >
                          {tag}
                          <button
                            type="button"
                            className="ml-0.5 cursor-pointer text-[var(--main-foreground)]/50 hover:text-[var(--main-foreground)]"
                            onClick={() => {
                              setDraft(prev => ({
                                ...prev,
                                tags: prev.tags?.filter(t => t !== tag) || []
                              }));
                            }}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Initial Status</Label>
                  <Select
                    value={draft.status}
                    onValueChange={(val: Status) => setDraft((prev) => ({ ...prev, status: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="backlog">Backlog</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Description / Notes</Label>
                  <Textarea
                    placeholder="Write your notes here or fetch problem description..."
                    value={draft.note}
                    onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))}
                    className="min-h-[200px] resize-none"
                  />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="explorer" className="flex-1 overflow-hidden px-4 sm:px-6 pt-2 pb-10 bg-background m-0 border-none outline-none focus-visible:ring-0">
            <CatalogExplorer 
              onAdd={async (problem) => {
                const problemData: ProblemDraft = { 
                  ...defaultDraft, 
                  url: problem.url,
                  title: problem.title,
                  platform: problem.platform,
                  difficulty: problem.difficulty,
                  tags: problem.tags || [],
                };
                
                try {
                  const res = await api.scrape(problem.url);
                  if (!res.error) {
                    problemData.note = res.note || res.description || "";
                    if (res.tags?.length) {
                      const allTags = [...new Set([...(problemData.tags || []), ...res.tags])];
                      problemData.tags = allTags;
                    }
                  }
                } catch {}
                 
                onCreateBulk([problemData]);
                toast.success("Problem added");
              }} 
            />
          </TabsContent>
        </Tabs>
        {tab === "manual" && (
          <div className="flex shrink-0 border-t-2 border-border bg-background p-6">
            <Button className="w-full" onClick={handleCreate}>
              Create Problem
            </Button>
          </div>
        )}
    </Modal>
  );
}
