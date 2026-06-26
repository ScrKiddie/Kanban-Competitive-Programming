import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { BoardColumn } from "@/components/board/board-column";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Board, Problem, Status, statuses } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/constants";
import { canRequestAIReview, canTransitionProblem } from "@/lib/problem-workflow";
import { cn } from "@/lib/utils";

const DESKTOP_DND_QUERY = "(min-width: 1280px)";

function useDesktopDnd() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia(DESKTOP_DND_QUERY).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_DND_QUERY);
    const sync = () => setEnabled(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  return enabled;
}

interface BoardKanbanProps {
  activeBoardId: string;
  problems: Problem[];
  filteredProblems: Problem[];
  hiddenCounts: Record<Status, number>;
  hasFilters: boolean;
  boards: Board[];
  moveProblem: (problemId: string, nextStatus: Status) => void | Promise<void>;
  setProblems: Dispatch<SetStateAction<Problem[]>>;
  setSelectedId: (id: string | null) => void;
  setForceRegenerateReview: (force: boolean) => void;
  setAiReviewProblemId: (id: string | null) => void;
  setReviewToDeleteId: (id: string | null) => void;
  setSolutionProblemId: (id: string | null) => void;
  setMoveToBoardProblemId: (id: string | null) => void;
  setProblemToDeleteId: (id: string | null) => void;
  onClearStatus: (status: Status) => void;
  canMoveToBoard?: boolean;
  onSync?: (id: string) => void;
}

export function BoardKanban({
  activeBoardId,
  problems,
  filteredProblems,
  hiddenCounts,
  hasFilters,
  moveProblem,
  setProblems,
  setSelectedId,
  setForceRegenerateReview,
  setAiReviewProblemId,
  setReviewToDeleteId,
  setSolutionProblemId,
  setMoveToBoardProblemId,
  setProblemToDeleteId,
  onClearStatus,
  canMoveToBoard,
  onSync,
}: BoardKanbanProps) {
  const isDesktopDnd = useDesktopDnd();
  const [pendingDropId, setPendingDropId] = useState<string | null>(null);


  const problemsById = useMemo(() => {
    return new Map(problems.map((problem) => [problem.id, problem]));
  }, [problems]);

  const filteredProblemsByStatus = useMemo(() => {
    const grouped = Object.fromEntries(statuses.map((status) => [status, [] as Problem[]])) as Record<Status, Problem[]>;

    for (const problem of filteredProblems) {
      grouped[problem.status].push(problem);
    }

    return grouped;
  }, [filteredProblems]);

  const totalProblemsByStatus = useMemo(() => {
    const totals = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<Status, number>;

    for (const problem of problems) {
      if (problem.boardId === activeBoardId) {
        totals[problem.status] += 1;
      }
    }

    return totals;
  }, [activeBoardId, problems]);

  const handleReview = useCallback((id: string, forceRegen?: boolean) => {
    const problem = problemsById.get(id);
    if (problem) {
      const transition = canRequestAIReview(problem);
      if (!transition.ok) {
        toast.error(transition.reason, {
          description: transition.description,
        });
        setSelectedId(id);
        return;
      }
    }

    setForceRegenerateReview(forceRegen === true);
    setAiReviewProblemId(id);
  }, [problemsById, setAiReviewProblemId, setForceRegenerateReview, setSelectedId]);

  const handleDragEnd = useCallback((result: DropResult) => {
    const destination = result.destination;
    const source = result.source;

    if (!isDesktopDnd || !destination) {
      return;
    }

    const activeId = result.draggableId;
    const targetStatus = destination.droppableId as Status;

    if (!statuses.includes(targetStatus)) {
      return;
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const activeProblem = problemsById.get(activeId);
    if (!activeProblem) {
      return;
    }

    const transition = canTransitionProblem(activeProblem, targetStatus);
    if (!transition.ok) {
      toast.error(transition.reason, {
        description: transition.description,
      });
      return;
    }

    setPendingDropId(activeId);
    setProblems((currentProblems) => {
      const boardProblems = currentProblems.filter((problem) => problem.boardId === activeProblem.boardId);
      const otherProblems = currentProblems.filter((problem) => problem.boardId !== activeProblem.boardId);
      const grouped = Object.fromEntries(
        statuses.map((status) => [status, boardProblems.filter((problem) => problem.status === status)]),
      ) as Record<Status, Problem[]>;

      const sourceStatus = source.droppableId as Status;
      const active = grouped[sourceStatus]?.[source.index];

      if (!active || active.id !== activeId) {
        const fallback = boardProblems.find((problem) => problem.id === activeId);
        if (!fallback) {
          return currentProblems;
        }

        for (const status of statuses) {
          grouped[status] = grouped[status].filter((problem) => problem.id !== activeId);
        }
        const destinationItems = grouped[targetStatus];
        const destinationIndex = Math.max(0, Math.min(destination.index, destinationItems.length));
        destinationItems.splice(destinationIndex, 0, { ...fallback, status: targetStatus });
      } else {
        grouped[sourceStatus].splice(source.index, 1);
        const destinationItems = grouped[targetStatus];
        const destinationIndex = Math.max(0, Math.min(destination.index, destinationItems.length));
        destinationItems.splice(destinationIndex, 0, { ...active, status: targetStatus });
      }

      return [...otherProblems, ...statuses.flatMap((status) => grouped[status])];
    });

    Promise.resolve(moveProblem(activeId, targetStatus)).finally(() => {
      setPendingDropId((current) => (current === activeId ? null : current));
    });
  }, [isDesktopDnd, problemsById, moveProblem, setProblems]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {!isDesktopDnd ? (
        <div className="flex w-full flex-1 flex-col relative min-h-[calc(100dvh-18rem)]">
          <Tabs defaultValue="today" className="w-full flex flex-1 flex-col gap-5 relative">
            <TabsList className="flex w-full items-stretch justify-between p-1 bg-secondary-background border-2 border-border shadow-[4px_4px_0px_0px_var(--border)] rounded-base h-auto gap-1">
              {statuses.map((status) => {
                const activeColorClass = 
                  status === "backlog" ? "data-[state=active]:bg-[var(--backlog)]" :
                  status === "today" ? "data-[state=active]:bg-[var(--today)]" :
                  status === "review" ? "data-[state=active]:bg-[var(--review)]" :
                  "data-[state=active]:bg-[var(--done)]";

                return (
                  <TabsTrigger
                    key={status}
                    value={status}
                    className={cn(
                      "group flex-1 text-xs py-2 px-1.5 flex items-center justify-center gap-1.5 font-heading capitalize border-2 border-transparent rounded-base transition-all select-none",
                      "data-[state=active]:border-border data-[state=active]:text-black",
                      activeColorClass
                    )}
                  >
                    <span className="truncate font-normal group-data-[state=active]:text-black">{STATUS_LABELS[status]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            {statuses.map((status) => {
              const items = filteredProblemsByStatus[status];
              const totalItems = totalProblemsByStatus[status];

              return (
                <TabsContent key={status} value={status} className="w-full min-h-0 flex flex-1 flex-col focus-visible:ring-0 focus-visible:ring-offset-0 mt-0 data-[state=inactive]:hidden relative">
                  <BoardColumn
                    status={status}
                    items={items}
                    totalItems={totalItems}
                    hiddenCount={hiddenCounts[status]}
                    hasFilters={hasFilters}
                    totalProblems={problems.length}
                    onOpen={setSelectedId}
                    onMove={moveProblem}
                    onReview={handleReview}
                    onDeleteReview={setReviewToDeleteId}
                    onSolution={setSolutionProblemId}
                    onMoveToBoard={setMoveToBoardProblemId}
                    canMoveToBoard={canMoveToBoard}
                    onDelete={setProblemToDeleteId}
                    onClear={onClearStatus}
                    onSync={onSync}
                    pendingProblemId={pendingDropId}
                    dragDisabled
                  />
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      ) : (
        <div className="flex flex-1 items-stretch min-h-[calc(100dvh-12rem)]">
          <div className="grid min-h-full w-full min-w-0 flex-1 grid-cols-4 items-stretch gap-4 overflow-visible 2xl:gap-5">
            {statuses.map((status) => {
              const items = filteredProblemsByStatus[status];
              const totalItems = totalProblemsByStatus[status];

              return (
                <div key={status} className="flex min-h-full flex-1 flex-col">
                  <BoardColumn
                    status={status}
                    items={items}
                    totalItems={totalItems}
                    hiddenCount={hiddenCounts[status]}
                    hasFilters={hasFilters}
                    totalProblems={problems.length}
                    onOpen={setSelectedId}
                    onMove={moveProblem}
                    onReview={handleReview}
                    onDeleteReview={setReviewToDeleteId}
                    onSolution={setSolutionProblemId}
                    onMoveToBoard={setMoveToBoardProblemId}
                    canMoveToBoard={canMoveToBoard}
                    onDelete={setProblemToDeleteId}
                    onClear={onClearStatus}
                  onSync={onSync}
                  pendingProblemId={pendingDropId}
                />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DragDropContext>
  );
}
