import { memo, useCallback, useState, type CSSProperties, type HTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Draggable, Droppable } from "@hello-pangea/dnd";
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
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { Problem, Status } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { ProblemCard } from "./problem-card";
import { cn } from "@/lib/utils";

interface BoardColumnProps {
  status: Status;
  items: Problem[];
  totalItems: number;
  hiddenCount: number;
  hasFilters: boolean;
  totalProblems: number;
  onOpen: (problemId: string) => void;
  onMove: (problemId: string, nextStatus: Status) => void;
  onReview?: (problemId: string, forceRegenerate?: boolean) => void;
  onDeleteReview?: (problemId: string) => void;
  onSolution?: (problemId: string) => void;
  onMoveToBoard?: (problemId: string) => void;
  canMoveToBoard?: boolean;
  onDelete?: (problemId: string) => void;
  onClear?: (status: Status) => void;
  dragDisabled?: boolean;
  onSync?: (problemId: string) => void;
  pendingProblemId?: string | null;
}

interface ProblemCardItemProps {
  problem: Problem;
  index: number;
  onOpen: (problemId: string) => void;
  onMove: (problemId: string, nextStatus: Status) => void;
  onReview?: (problemId: string, forceRegenerate?: boolean) => void;
  onDeleteReview?: (problemId: string) => void;
  onSolution?: (problemId: string) => void;
  onMoveToBoard?: (problemId: string) => void;
  canMoveToBoard?: boolean;
  onDelete?: (problemId: string) => void;
  dragDisabled?: boolean;
  onSync?: (problemId: string) => void;
  pendingProblemId?: string | null;
}

const ProblemCardItem = memo(function ProblemCardItem({ problem, index, onOpen, onMove, onReview, onDeleteReview, onSolution, onMoveToBoard, canMoveToBoard, onDelete, dragDisabled, onSync, pendingProblemId }: ProblemCardItemProps) {
  const handleOpen = useCallback(() => onOpen(problem.id), [onOpen, problem.id]);
  const handleMove = useCallback((nextStatus: Status) => onMove(problem.id, nextStatus), [onMove, problem.id]);
  const handleReview = useCallback((forceRegenerate?: boolean) => onReview?.(problem.id, forceRegenerate), [onReview, problem.id]);
  const handleDeleteReview = useCallback(() => onDeleteReview?.(problem.id), [onDeleteReview, problem.id]);
  const handleSolution = useCallback(() => onSolution?.(problem.id), [onSolution, problem.id]);
  const handleMoveToBoard = useCallback(() => onMoveToBoard?.(problem.id), [onMoveToBoard, problem.id]);
  const handleDelete = useCallback(() => onDelete?.(problem.id), [onDelete, problem.id]);
  const handleSync = useCallback(() => onSync?.(problem.id), [onSync, problem.id]);

  const card = (isDragging = false, dragHandleProps?: HTMLAttributes<HTMLElement> | null, isDropAnimating = false) => (
    <ProblemCard
      problem={problem}
      onOpen={handleOpen}
      onMove={handleMove}
      onReview={onReview ? handleReview : undefined}
      onDeleteReview={onDeleteReview ? handleDeleteReview : undefined}
      onSolution={onSolution ? handleSolution : undefined}
      onMoveToBoard={onMoveToBoard ? handleMoveToBoard : undefined}
      canMoveToBoard={canMoveToBoard}
      onDelete={onDelete ? handleDelete : undefined}
      dragDisabled={dragDisabled}
      isDragging={isDragging}
      dragHandleProps={dragHandleProps}
      onSync={onSync ? handleSync : undefined}
      pending={pendingProblemId === problem.id || isDropAnimating}
    />
  );

  if (dragDisabled) {
    return card(false, null);
  }

  return (
    <Draggable draggableId={problem.id} index={index}>
      {(provided, snapshot) => {
        const draggableContent = (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={{
              ...(provided.draggableProps.style as CSSProperties),
              marginBottom: 12,
              transition: snapshot.isDropAnimating ? "transform 0.01s" : provided.draggableProps.style?.transition,
            }}
            className={cn(snapshot.isDragging ? "z-[99999]" : "z-10")}
          >
            {card(snapshot.isDragging, provided.dragHandleProps, snapshot.isDropAnimating)}
          </div>
        );

        if (snapshot.isDragging) {
          return createPortal(draggableContent, document.body);
        }

        return draggableContent;
      }}
    </Draggable>
  );
});

export const BoardColumn = memo(function BoardColumn({ status, items, totalItems, hiddenCount, onOpen, onMove, onReview, onDeleteReview, onSolution, onMoveToBoard, canMoveToBoard, onDelete, onClear, dragDisabled = false, onSync, pendingProblemId }: BoardColumnProps) {
  const [clearOpen, setClearOpen] = useState(false);

  const emptyState = null;

  const content = items.map((problem, index) => (
    <ProblemCardItem 
      key={problem.id} 
      problem={problem} 
      index={index} 
      onOpen={onOpen} 
      onMove={onMove} 
      onReview={onReview} 
      onDeleteReview={onDeleteReview} 
      onSolution={onSolution} 
      onMoveToBoard={onMoveToBoard} 
      canMoveToBoard={canMoveToBoard} 
      onDelete={onDelete} 
      dragDisabled={dragDisabled} 
      onSync={onSync} 
      pendingProblemId={pendingProblemId} 
    />
  ));

  return (
    <section className="rounded-base flex min-h-[280px] flex-1 w-full shrink-0 flex-col border-2 border-border p-3 text-status-foreground shadow-shadow md:min-h-[500px] md:min-w-0 md:w-auto md:shrink xl:flex-1" style={{ backgroundColor: STATUS_COLORS[status] }}>
      <div className="mb-3 flex items-start justify-between gap-3 border-b-2 border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-heading leading-none tracking-tight">{STATUS_LABELS[status]}</h2>
            <Badge className="border-2 bg-secondary-background font-heading text-foreground dark:text-foreground">{items.length}</Badge>
          </div>
          <p className="mt-2 text-xs font-heading uppercase tracking-[0.14em] text-status-foreground/70">{items.length} visible / {totalItems} total</p>
        </div>
        <div className="flex items-center gap-2">
          {onClear ? (
            <>
              <IconButton
                variant="danger"
                size="md"
                tooltip={`Clear ${STATUS_LABELS[status]} tickets`}
                disabled={totalItems === 0}
                onClick={() => setClearOpen(true)}
              >
                <Trash2 />
              </IconButton>
              <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear {STATUS_LABELS[status]} Tickets</AlertDialogTitle>
                    <AlertDialogDescription>
                      this will delete all {totalItems} ticket(s) in this column from the current board. this action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-[var(--danger)] text-[var(--danger-foreground)] hover:bg-[var(--danger)]" onClick={() => {
                      onClear(status);
                      setClearOpen(false);
                    }}>
                      Clear Tickets
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : null}
        </div>
      </div>

      {hiddenCount > 0 ? <div className="mb-3 rounded-base border-2 border-dashed border-border bg-secondary-background px-3 py-2 text-xs font-heading uppercase tracking-[0.12em] text-foreground">{hiddenCount} item hidden by active filter</div> : null}

      <div className="flex-1 relative min-h-0 flex flex-col pt-2">
        {emptyState}
        {dragDisabled ? (
          <div className="flex flex-1 flex-col gap-3 pr-1 relative z-10">{content}</div>
        ) : (
          <Droppable droppableId={status} type="PROBLEM">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-1 flex-col pr-1 min-h-[100px] relative z-10">
                {content}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
      </div>
    </section>
  );
});
