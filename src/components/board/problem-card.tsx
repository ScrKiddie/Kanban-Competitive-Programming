import { memo, type HTMLAttributes } from "react";
import { Settings, ArrowRightLeft, Eraser, PackageX, Code2, ExternalLink, Eye, RefreshCw, Sparkles, GitBranch, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, PLATFORM_COLORS, PLATFORM_LABELS, STATUS_LABELS } from "@/lib/constants";
import { Problem, Status, statuses } from "@/lib/types";
import { toast } from "sonner";
import { cn, safeRelativeTime } from "@/lib/utils";
import { canTransitionProblem } from "@/lib/problem-workflow";
import { openExternalUrl } from "@/lib/open-external-url";

interface ProblemCardProps {
  problem: Problem;
  onOpen: () => void;
  onMove: (status: Status) => void;
  onReview?: (forceRegenerate?: boolean) => void;
  onDeleteReview?: (id: string) => void;
  onSolution?: () => void;
  onMoveToBoard?: (id: string) => void;
  canMoveToBoard?: boolean;
  onDelete?: (id: string) => void;
  overlay?: boolean;
  overlayWidth?: number;
  overlayHeight?: number;
  dragDisabled?: boolean;
  isDragging?: boolean;
  dragHandleProps?: HTMLAttributes<HTMLElement> | null;
  onSync?: () => void;
  pending?: boolean;
}

const ProblemCardBody = memo(function ProblemCardBody({ problem, onOpen, onMove, onReview, onDeleteReview, onSolution, onMoveToBoard, onDelete, canMoveToBoard, onSync }: { problem: Problem; onOpen: () => void; onMove: (status: Status) => void; onReview?: (forceRegenerate?: boolean) => void; onDeleteReview?: (id: string) => void; onSolution?: () => void; onMoveToBoard?: (id: string) => void; onDelete?: (id: string) => void; canMoveToBoard?: boolean; onSync?: () => void }) {
  const actionButtonClass = "h-9 min-w-0 flex-[1_1_0] px-2 text-[11px] font-heading leading-none sm:text-xs @max-[220px]/card:size-9 @max-[220px]/card:flex-none @max-[220px]/card:px-0";
  const actionIconClass = "hidden @max-[220px]/card:block";
  const actionLabelClass = "@max-[220px]/card:sr-only";
  const sourceHref = problem.url ? (/^https?:\/\//i.test(problem.url) ? problem.url : `https://${problem.url}`) : "";

  const stopDrag = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
  };

  return (
    <div className="@container/card">
      <div className="flex items-start gap-2">
        <div className="flex-1 text-left">
          <h3 className="line-clamp-2 text-base font-heading leading-tight tracking-tight">{problem.title}</h3>
        </div>
        <div className="flex gap-2 shrink-0">
          {onMoveToBoard && (
            <IconButton
              size="sm"
              onPointerDown={stopDrag}
              onMouseDown={stopDrag}
              onTouchStart={stopDrag}
              onClick={(e) => {
                e.stopPropagation();
                if (canMoveToBoard) {
                  onMoveToBoard(problem.id);
                }
              }}
              tooltip={canMoveToBoard ? "Move to another board" : "No other boards available"}
              disabled={!canMoveToBoard}
            >
              <ArrowRightLeft />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              variant="danger"
              size="sm"
              onPointerDown={stopDrag}
              onMouseDown={stopDrag}
              onTouchStart={stopDrag}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(problem.id);
              }}
              tooltip="Delete problem"
            >
              <Eraser />
            </IconButton>
          )}
        </div>
      </div>

      <div className="mt-2 flex min-w-0 flex-wrap gap-2">
        <Badge
          style={{ backgroundColor: PLATFORM_COLORS[problem.platform as keyof typeof PLATFORM_COLORS] || PLATFORM_COLORS.custom }}
          className="max-w-[min(100%,14rem)] min-w-0 !w-auto !shrink overflow-hidden border-2 font-heading text-main-foreground"
        >
          <span className="block min-w-0 truncate">
            {PLATFORM_LABELS[problem.platform as keyof typeof PLATFORM_LABELS] || problem.platform}
          </span>
        </Badge>
        <Badge
          style={{ backgroundColor: DIFFICULTY_COLORS[problem.difficulty] }}
          className="max-w-[min(100%,10rem)] min-w-0 !w-auto !shrink overflow-hidden border-2 font-heading text-main-foreground"
        >
          <span className="block min-w-0 truncate">{DIFFICULTY_LABELS[problem.difficulty]}</span>
        </Badge>
        {problem.aiReview && (
          <Badge className="max-w-[min(100%,10rem)] min-w-0 !w-auto !shrink overflow-hidden gap-1 border-2 border-border bg-[#93C5FD] text-main-foreground">
            <span className="block min-w-0 truncate">Reviewed</span>
          </Badge>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <div className="min-w-0 flex-1 @max-[340px]/card:basis-full" onPointerDown={stopDrag} onMouseDown={stopDrag} onTouchStart={stopDrag}>
          <Select value={problem.status} onValueChange={(value) => {
            const nextStatus = value as Status;
            if (nextStatus !== problem.status) {
              const transition = canTransitionProblem(problem, nextStatus);
              if (!transition.ok) {
                toast(transition.reason, { description: transition.description });
                return;
              }
            }
            onMove(nextStatus);
          }}>
            <SelectTrigger className="h-9 text-xs w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => {
                const transition = canTransitionProblem(problem, status);
                return (
                  <SelectItem key={status} value={status} disabled={!transition.ok}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 shrink-0">
        <IconButton
          size="lg"
          onPointerDown={stopDrag}
          onMouseDown={stopDrag}
          onTouchStart={stopDrag}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          aria-label="Open problem details"
          tooltip="Open problem details"
        >
          <Settings />
        </IconButton>
        {sourceHref ? (
          <Button
            size="icon"
            variant="default"
            className="size-9 shrink-0"
            tooltip="Open source link"
            onPointerDown={stopDrag}
            onMouseDown={stopDrag}
            onTouchStart={stopDrag}
            onClick={(event) => {
              event.stopPropagation();
              void openExternalUrl(sourceHref);
            }}
            aria-label="Open source link"
          >
            <ExternalLink />
          </Button>
        ) : null}
        {(["today", "review", "done"].includes(problem.status) || (problem.status === "backlog" && problem.solutionCode)) && onSolution && (
          <IconButton
            size="lg"
            onPointerDown={stopDrag}
            onMouseDown={stopDrag}
            onTouchStart={stopDrag}
            onClick={(e) => {
              e.stopPropagation();
              onSolution();
            }}
            aria-label="Write solution"
            tooltip="Write Solution"
          >
            <Code2 />
          </IconButton>
        )}
        {problem.status === "done" && onSync && (
          <IconButton
            size="lg"
            onPointerDown={stopDrag}
            onMouseDown={stopDrag}
            onTouchStart={stopDrag}
            onClick={(e) => {
              e.stopPropagation();
              onSync();
            }}
            disabled={problem.githubSyncStatus === "syncing"}
            aria-label="Sync solution to GitHub"
            tooltip={problem.githubSyncStatus === "syncing" ? "Syncing..." : "Sync to GitHub"}
          >
            {problem.githubSyncStatus === "syncing" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <GitBranch />
            )}
          </IconButton>
        )}
        </div>
      </div>

      {(problem.status === "review" || problem.aiReview) && onReview && (
        <div className="mt-2 flex flex-wrap min-w-0 w-full gap-2">
          {(!problem.aiReview) && (
            <>
              <Button
                type="button"
                size="sm"
                className={cn(actionButtonClass, "@max-[220px]/card:hidden")}
                aria-label="Review with AI"
                onPointerDown={stopDrag}
                onMouseDown={stopDrag}
                onTouchStart={stopDrag}
                onClick={(e) => {
                  e.stopPropagation();
                  onReview();
                }}
              >
                <Sparkles className={actionIconClass} />
                <span className={actionLabelClass}>Review with AI</span>
              </Button>
              
              <Button
                type="button"
                size="icon"
                className={cn(actionButtonClass, "hidden @max-[220px]/card:flex !w-9 !px-0")}
                aria-label="Review with AI"
                tooltip="Review with AI"
                onPointerDown={stopDrag}
                onMouseDown={stopDrag}
                onTouchStart={stopDrag}
                onClick={(e) => {
                  e.stopPropagation();
                  onReview();
                }}
              >
                <Sparkles className={actionIconClass} />
              </Button>
            </>
          )}

          {problem.aiReview && (
            <>
              <Button
                type="button"
                size="sm"
                className={cn(actionButtonClass, "@max-[220px]/card:hidden")}
                aria-label="View Review"
                onPointerDown={stopDrag}
                onMouseDown={stopDrag}
                onTouchStart={stopDrag}
                onClick={(e) => {
                  e.stopPropagation();
                  onReview();
                }}
              >
                <Eye className={actionIconClass} />
                <span className={actionLabelClass}>View Review</span>
              </Button>
              
              <Button
                type="button"
                size="icon"
                className={cn(actionButtonClass, "hidden @max-[220px]/card:flex !w-9 !px-0")}
                aria-label="View Review"
                tooltip="View Review"
                onPointerDown={stopDrag}
                onMouseDown={stopDrag}
                onTouchStart={stopDrag}
                onClick={(e) => {
                  e.stopPropagation();
                  onReview();
                }}
              >
                <Eye className={actionIconClass} />
              </Button>

              {problem.status === "review" && problem.aiReview && onReview && (
                <>
                  <Button
                    type="button"
                    variant="review"
                    size="sm"
                    className={cn(actionButtonClass, "@max-[220px]/card:hidden")}
                    aria-label="Re-review"
                    onPointerDown={stopDrag}
                    onMouseDown={stopDrag}
                    onTouchStart={stopDrag}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReview(true);
                    }}
                  >
                    <RefreshCw className={actionIconClass} />
                    <span className={actionLabelClass}>Re-review</span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant="review"
                    size="icon"
                    className={cn(actionButtonClass, "hidden @max-[220px]/card:flex !w-9 !px-0")}
                    aria-label="Re-review"
                    tooltip="Re-review"
                    onPointerDown={stopDrag}
                    onMouseDown={stopDrag}
                    onTouchStart={stopDrag}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReview(true);
                    }}
                  >
                    <RefreshCw className={actionIconClass} />
                  </Button>
                </>
              )}

              {onDeleteReview && problem.status !== "done" && (
                <IconButton
                  variant="danger"
                  size="lg"
                  className="h-9 w-9 flex-none"
                  onPointerDown={stopDrag}
                  onMouseDown={stopDrag}
                  onTouchStart={stopDrag}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteReview(problem.id);
                  }}
                  tooltip="Delete AI Review"
                >
                  <PackageX />
                </IconButton>
              )}
            </>
          )}
        </div>
      )}

      {problem.githubSyncedAt && (
        <div className="-mx-4 -mb-4 mt-3 flex items-center gap-1.5 border-t-2 border-border bg-secondary-background/60 px-4 py-2.5 text-xs font-medium text-foreground/70 rounded-b-base">
          <GitBranch className="h-3.5 w-3.5 shrink-0" />
          <span>Synced {safeRelativeTime(problem.githubSyncedAt)}</span>
        </div>
      )}
    </div>
  );
})

function OverlayProblemCard({ problem, onOpen, onMove, onReview, onDeleteReview, onSolution, onMoveToBoard, onDelete, overlayWidth, overlayHeight, canMoveToBoard, onSync }: ProblemCardProps & { onSolution?: () => void, overlayWidth?: number, overlayHeight?: number }) {
  return (
    <div style={{ width: overlayWidth, minWidth: overlayWidth, maxWidth: overlayWidth, height: overlayHeight || undefined }} className="bg-transparent">
      <Card
        className="relative z-[9999] min-h-full w-full cursor-grabbing gap-3 bg-secondary-background p-4 opacity-100 shadow-shadow will-change-transform"
      >
        <ProblemCardBody problem={problem} onOpen={onOpen} onMove={onMove} onReview={onReview} onDeleteReview={onDeleteReview} onSolution={onSolution} onMoveToBoard={onMoveToBoard} onDelete={onDelete} canMoveToBoard={canMoveToBoard} onSync={onSync} />
      </Card>
    </div>
  )
}

function InteractiveProblemCard({ problem, onOpen, onMove, onReview, onDeleteReview, onSolution, onMoveToBoard, onDelete, canMoveToBoard, dragDisabled, isDragging = false, dragHandleProps, onSync, pending = false }: ProblemCardProps & { onSolution?: () => void }) {
  return (
    <div
      className={cn("relative w-full bg-transparent")}
    >
      <Card 
        {...(!dragDisabled && !pending ? dragHandleProps : undefined)}
        className={cn(
          "relative w-full gap-3 bg-secondary-background p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-secondary-background shadow-none",
          pending && "pointer-events-none opacity-65",
          dragDisabled || pending ? "cursor-default" : "cursor-grab",
          !dragDisabled && !pending && isDragging && "cursor-grabbing bg-secondary-background"
        )}
        tabIndex={pending ? -1 : 0}
        onKeyDown={(e) => {
          if (pending) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
          }
        }}
        onKeyUp={(e) => {
          if (pending) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        <ProblemCardBody problem={problem} onOpen={onOpen} onMove={onMove} onReview={onReview} onDeleteReview={onDeleteReview} onSolution={onSolution} onMoveToBoard={onMoveToBoard} onDelete={onDelete} canMoveToBoard={canMoveToBoard} onSync={onSync} />
        {pending ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-base bg-secondary-background/75 text-foreground">
            <Loader2 className="size-7 animate-spin" aria-hidden="true" />
            <span className="sr-only">Moving problem</span>
          </div>
        ) : null}
      </Card>
    </div>
  )
}

export const ProblemCard = memo(function ProblemCard({ problem, onOpen, onMove, onReview, onDeleteReview, onSolution, onMoveToBoard, onDelete, overlay = false, overlayWidth, overlayHeight, canMoveToBoard, dragDisabled, isDragging, dragHandleProps, onSync, pending }: ProblemCardProps) {
  if (overlay) {
    return <OverlayProblemCard problem={problem} onOpen={onOpen} onMove={onMove} onReview={onReview} onDeleteReview={onDeleteReview} onSolution={onSolution} onMoveToBoard={onMoveToBoard} onDelete={onDelete} overlayWidth={overlayWidth} overlayHeight={overlayHeight} canMoveToBoard={canMoveToBoard} onSync={onSync} />
  }

  return <InteractiveProblemCard problem={problem} onOpen={onOpen} onMove={onMove} onReview={onReview} onDeleteReview={onDeleteReview} onSolution={onSolution} onMoveToBoard={onMoveToBoard} onDelete={onDelete} canMoveToBoard={canMoveToBoard} dragDisabled={dragDisabled} isDragging={isDragging} dragHandleProps={dragHandleProps} onSync={onSync} pending={pending} />
});
