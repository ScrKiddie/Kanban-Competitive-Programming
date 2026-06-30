import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Plus, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { openExternalUrl } from "@/lib/open-external-url";
import type { Platform, Difficulty, CatalogResponse, CatalogProblem } from "@/shared";
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Unknown error";
}

interface CatalogExplorerProps {
  onAdd: (problem: CatalogProblem) => Promise<void>;
}

export function CatalogExplorer({ onAdd }: CatalogExplorerProps) {
  const [platform, setPlatform] = useState<Platform>("leetcode");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 500);
  
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [addingUrl, setAddingUrl] = useState<string | null>(null);

  const limit = 20;

  useEffect(() => {
    let isMounted = true;
    const fetchProblems = async () => {
      setLoading(true);
      try {
        const result = await api.catalog.list(platform, page, limit, debouncedSearch, difficulty);
        if (isMounted) setData(result);
      } catch (e: unknown) {
        const message = getErrorMessage(e);
        if (isMounted) toast.error("Failed to fetch catalog: " + message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProblems();
    return () => { isMounted = false; };
  }, [platform, page, debouncedSearch, difficulty]);

  useEffect(() => {
    setPage(1);
  }, [platform, debouncedSearch, difficulty]);

  const handleAdd = async (p: CatalogProblem) => {
    setAddingUrl(p.url);
    try {
      await onAdd(p);
    } catch (e: unknown) {
      const message = getErrorMessage(e);
      toast.error("Failed to add problem: " + message);
    } finally {
      setAddingUrl(null);
    }
  };



  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-base border-2 border-border bg-secondary-background px-4">
          <Search className="size-4 shrink-0 text-foreground/70" />
          <Input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search catalog" 
            className="min-h-0 w-full min-w-0 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" 
          />
        </label>
        <div className="flex gap-2">
          <div className="w-[140px]">
            <Select value={platform} onValueChange={(val: Platform) => setPlatform(val)}>
              <SelectTrigger className="h-10 text-sm w-full px-2 sm:px-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leetcode">LeetCode</SelectItem>
                <SelectItem value="codeforces">Codeforces</SelectItem>
                <SelectItem value="hackerrank">HackerRank</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[110px]">
            <Select value={difficulty} onValueChange={(val: Difficulty | "all") => setDifficulty(val)}>
              <SelectTrigger className="h-10 text-sm w-full px-2 sm:px-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Diff</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] border-2 border-border bg-background rounded-base overflow-hidden flex flex-col relative">
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
        
        <ScrollArea className="flex-1" viewportClassName="overflow-x-hidden">
          {data?.problems.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No problems found
            </div>
          ) : (
            <div className="divide-y-2 divide-border overflow-x-hidden w-full">
              {data?.problems.map((p) => {
                const isAdding = addingUrl === p.url;
                
                return (
                  <div key={p.id} className="p-3 flex items-start justify-between bg-secondary-background hover:bg-muted transition-colors gap-3 overflow-hidden">
                    <div className="min-w-0 flex-1 overflow-hidden pr-1">
                      <div className="flex items-center gap-2 mb-1 min-w-0 overflow-hidden">
                        <Badge 
                          style={{ backgroundColor: DIFFICULTY_COLORS[p.difficulty] }}
                          className="border-2 font-heading text-main-foreground px-1.5 py-0 text-[10px] leading-4"
                        >
                          {DIFFICULTY_LABELS[p.difficulty]}
                        </Badge>
                        {p.acceptanceRate && (
                          <span className="shrink-0 text-xs font-heading text-foreground whitespace-nowrap">
                            {p.acceptanceRate}% AC
                          </span>
                        )}
                      </div>
                      <h4 className="font-heading text-sm leading-snug line-clamp-2">{p.title}</h4>
                      {p.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-1.5 min-w-0 max-w-full overflow-hidden whitespace-nowrap">
                          {p.tags.slice(0, 3).map(t => (
                          <Badge 
                            key={t} 
                            variant="default" 
                            className="min-w-0 max-w-[9.5rem] px-2 py-0 text-[10px] font-heading leading-4"
                            title={t}
                          >
                            <span className="min-w-0 truncate">{t}</span>
                          </Badge>
                          ))}
                          {p.tags.length > 3 && (
                            <span className="shrink-0 self-center text-[10px] font-heading text-foreground/70">+{p.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex shrink-0 items-center gap-2 self-start">
                      <Button
                        size="icon"
                        variant="default"
                        className="size-9"
                        tooltip="Open on platform"
                        onClick={() => void openExternalUrl(p.url)}
                        aria-label={`Open ${p.title} on platform`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="default"
                        disabled={isAdding}
                        onClick={() => handleAdd(p)}
                        className="size-9 shrink-0"
                        tooltip="Add problem"
                        aria-label={`Add ${p.title}`}
                      >
                        {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                         <Plus className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        
        <div className="p-3 border-t-2 border-border bg-secondary-background flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {data ? `${(page - 1) * limit + 1}-${Math.min(page * limit, data.total)} of ${data.total}` : "..."}
          </div>
          <div className="flex gap-2">
            <Button 
              size="icon" 
              variant="neutral" 
              className="h-9 w-9 rounded-sm hover:bg-secondary-background"
              disabled={page === 1 || loading}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              size="icon" 
              variant="neutral" 
              className="h-9 w-9 rounded-sm hover:bg-secondary-background"
              disabled={!data?.hasMore || loading}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
