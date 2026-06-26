"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { RecoveryScreen } from "@/components/app/recovery-screen";
import { BoardKanban } from "@/components/board/board-kanban";
import { TopBar } from "@/components/board/top-bar";
import { AddProblemDialog } from "@/components/problem/add-problem-dialog";
import { DetailPanel } from "@/components/problem/detail-panel";
import { SolutionPanel } from "@/components/problem/solution-panel";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import kanbanCpLogoUrl from "@/assets/kanbancp-logo.svg";
import {
  Board,
  Difficulty,
  Platform,
  Status,
  statuses,
} from "@/lib/types";
import { DEFAULT_BOARD } from "@/lib/constants";
import { BoardSidebar } from "@/components/board/board-sidebar";
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
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { BoardCreateDialog } from "@/components/board/board-create-dialog";
import { BoardEditDialog } from "@/components/board/board-edit-dialog";
import { BoardDeleteDialog } from "@/components/board/board-delete-dialog";
import { MoveToBoardDialog } from "@/components/board/move-to-board-dialog";
import { AIReviewDialog } from "@/components/problem/ai-review-dialog";
import { toast } from "sonner";
import { createProblem, matchesFilters } from "@/lib/problem-utils";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { useAppState } from "@/hooks/use-app-state";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useOnboarding } from "@/hooks/use-onboarding";
import { QuickGuideDialog } from "@/components/onboarding/quick-guide-dialog";
import { WelcomeDialog } from "@/components/onboarding/welcome-dialog";
import { SettingsDialog } from "@/components/app/settings-dialog";
import { Loader2 } from "lucide-react";

import { TooltipProvider } from "@/components/ui/tooltip";

export function KanbanCpApp() {
  const {
    loaded,
    corruptData,
    problems,
    setProblems,
    replaceProblems,
    updateProblem,
    boards,
    activeBoardId,
    setActiveBoardId,
    handleCreateBoard,
    handleEditBoard,
    handleDeleteBoard,
    handleDeleteProblem,
    handleClearProblemsByStatus,
    saveState,
    saveMessage,
    handleResetData,
    settings,
    refreshSettings,
    handleSyncProblem,
  } = useAppState();

  const hasValidGithubPat = useMemo(() => {
    return Boolean(settings?.githubToken?.trim() && settings?.githubRepoUrl?.trim());
  }, [settings]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [solutionProblemId, setSolutionProblemId] = useState<string | null>(null);
  
  const [addOpen, setAddOpen] = useState(false);
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [editBoardOpen, setEditBoardOpen] = useState(false);
  const [deleteBoardOpen, setDeleteBoardOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [boardToEdit, setBoardToEdit] = useState<Board | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  
  const [moveToBoardProblemId, setMoveToBoardProblemId] = useState<string | null>(null);
  const [problemToDeleteId, setProblemToDeleteId] = useState<string | null>(null);
  
  const [aiReviewProblemId, setAiReviewProblemId] = useState<string | null>(null);
  const [reviewToDeleteId, setReviewToDeleteId] = useState<string | null>(null);
  const [forceRegenerateReview, setForceRegenerateReview] = useState(false);
  
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const deferredSearch = useDeferredValue(debouncedSearch);
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [isBoardSwitching, setIsBoardSwitching] = useState(false);
  const [pendingBoardId, setPendingBoardId] = useState<string | null>(null);
  const boardSwitchTimerRef = useRef<number | null>(null);
  const mainScrollViewportRef = useRef<HTMLDivElement | null>(null);
  const onboarding = useOnboarding();

  const activeBoard = useMemo(
    () => boards.find((b) => b.id === activeBoardId) || DEFAULT_BOARD,
    [boards, activeBoardId]
  );

  const visibleBoards = useMemo(
    () => boards.length > 0 ? boards : [DEFAULT_BOARD],
    [boards]
  );

  useEffect(() => {
    return () => {
      if (boardSwitchTimerRef.current) {
        window.clearTimeout(boardSwitchTimerRef.current);
      }
    };
  }, []);
  
  const activeBoardProblems = useMemo(
    () => problems.filter((p) => p.boardId === activeBoardId),
    [problems, activeBoardId]
  );

  const selectedProblem = useMemo(
    () => problems.find((problem) => problem.id === selectedId) ?? null,
    [problems, selectedId],
  );

  const solutionProblem = useMemo(
    () => problems.find((problem) => problem.id === solutionProblemId) ?? null,
    [problems, solutionProblemId],
  );

  const aiReviewProblem = useMemo(
    () => problems.find((problem) => problem.id === aiReviewProblemId) ?? null,
    [aiReviewProblemId, problems]
  );

  const handleMoveToBoard = async (problemId: string, targetBoardId: string) => {
    await updateProblem(problemId, { boardId: targetBoardId });
    setMoveToBoardProblemId(null);
    toast.success("Problem moved to another board");

    if (selectedId === problemId) {
      setSelectedId(null);
    }
  };

  const handleClearStatus = (status: Status) => {
    handleClearProblemsByStatus(status);
    toast.success(`Tickets cleared from ${activeBoard.name}`);

    if (selectedProblem?.status === status) {
      setSelectedId(null);
    }
  };

  const handleSelectBoard = (boardId: string) => {
    if (boardId === activeBoardId) return;

    if (boardSwitchTimerRef.current) {
      window.clearTimeout(boardSwitchTimerRef.current);
    }

    setIsBoardSwitching(true);
    setPendingBoardId(boardId);
    mainScrollViewportRef.current?.scrollTo({ top: 0, behavior: "auto" });
    setSelectedId(null);
    setSolutionProblemId(null);
    setAiReviewProblemId(null);
    setMoveToBoardProblemId(null);
    setProblemToDeleteId(null);
    setReviewToDeleteId(null);

    window.requestAnimationFrame(() => {
      startTransition(() => {
        setActiveBoardId(boardId);
      });

      boardSwitchTimerRef.current = window.setTimeout(() => {
        setIsBoardSwitching(false);
        setPendingBoardId(null);
        boardSwitchTimerRef.current = null;
      }, 320);
    });
  };

  const filteredProblems = useMemo(
    () => activeBoardProblems.filter((problem) => matchesFilters(problem, deferredSearch, platformFilter, difficultyFilter)),
    [difficultyFilter, platformFilter, activeBoardProblems, deferredSearch],
  );

  const hiddenCounts = useMemo(() => {
    const totalCounts: Record<Status, number> = {
      backlog: 0,
      today: 0,
      review: 0,
      done: 0,
    };
    const visibleCounts: Record<Status, number> = {
      backlog: 0,
      today: 0,
      review: 0,
      done: 0,
    };

    for (const problem of activeBoardProblems) {
      totalCounts[problem.status] += 1;
    }

    for (const problem of filteredProblems) {
      visibleCounts[problem.status] += 1;
    }

    const counts = Object.fromEntries(
      statuses.map((status) => [status, Math.max(totalCounts[status] - visibleCounts[status], 0)]),
    ) as Record<Status, number>;

    return counts;
  }, [filteredProblems, activeBoardProblems]);

  const hasFilters = Boolean(deferredSearch.trim()) || platformFilter !== "all" || difficultyFilter !== "all";
  const isTitleSearchPending = search !== debouncedSearch || debouncedSearch !== deferredSearch;
  const isMainAreaLoading = isTitleSearchPending || isBoardSwitching;

  if (corruptData) {
    return (
      <RecoveryScreen
        onReset={async () => {
          await handleResetData();
          setSelectedId(null);
        }}
      />
    );
  }

    if (!loaded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4 py-4 md:px-6 md:py-6">
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="relative z-10 flex aspect-square size-14 items-center justify-center overflow-hidden rounded-base border-2 border-border bg-main text-main-foreground">
              <img src={kanbanCpLogoUrl} alt="KanbanCP" className="size-full translate-y-px object-cover" draggable={false} />
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-3xl font-heading font-medium tracking-tight text-foreground">
              KanbanCP
            </h1>
            <div className="flex flex-col items-center gap-2 w-[240px]">
              <Progress value={80} className="w-full" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const appContent = (
    <SidebarInset className="m-0 flex min-w-0 flex-1 flex-col bg-background h-dvh overflow-hidden">
      <ScrollArea
        className="h-full w-full"
        viewportRef={mainScrollViewportRef}
        viewportClassName={cn(
          "h-full [&>div]:min-h-full [&>div]:flex [&>div]:flex-col [&>div]:w-full",
          isMainAreaLoading && "overflow-hidden"
        )}
      >
        <div className="mx-auto flex min-h-full w-full max-w-[1920px] flex-1 flex-col gap-5 px-4 py-5 md:px-7 lg:px-6">
          <TopBar
          search={search}
          onSearchChange={setSearch}
          platformFilter={platformFilter}
          onPlatformChange={setPlatformFilter}
          difficultyFilter={difficultyFilter}
          onDifficultyChange={setDifficultyFilter}
          saveState={saveState}
          saveMessage={saveMessage}
          onAdd={() => setAddOpen(true)}
          board={activeBoard}
          onEditBoard={() => { setBoardToEdit(activeBoard); setEditBoardOpen(true); }}
          onDeleteBoard={() => { setBoardToDelete(activeBoard); setDeleteBoardOpen(true); }}
          onOpenGuide={onboarding.openGuide}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {saveState === "error" ? (
          <Card className="bg-[var(--danger)] p-4 text-sm font-medium text-[var(--danger-foreground)]">
            Save failed. {saveMessage || "Something went wrong"}
          </Card>
        ) : null}

        <div className="relative flex flex-col gap-5 min-h-0 xl:flex-1">
          <BoardKanban
            activeBoardId={activeBoardId}
            problems={problems}
            filteredProblems={filteredProblems}
            hiddenCounts={hiddenCounts}
            hasFilters={hasFilters}
            canMoveToBoard={boards.length > 1}
            boards={boards}
            moveProblem={(id, status) => updateProblem(id, { status })}
            setProblems={setProblems}
            setSelectedId={setSelectedId}
            setForceRegenerateReview={setForceRegenerateReview}
            setAiReviewProblemId={setAiReviewProblemId}
            setReviewToDeleteId={setReviewToDeleteId}
            setSolutionProblemId={setSolutionProblemId}
            setMoveToBoardProblemId={setMoveToBoardProblemId}
            setProblemToDeleteId={setProblemToDeleteId}
            onClearStatus={handleClearStatus}
            onSync={hasValidGithubPat ? handleSyncProblem : undefined}
          />
          {isMainAreaLoading ? (
            <div className="absolute inset-0 z-30 flex items-start justify-center rounded-base bg-background/75 pt-[38vh] text-foreground">
              <Loader2 className="size-9 animate-spin" aria-hidden="true" />
              <span className="sr-only">Loading board</span>
            </div>
          ) : null}
        </div>

          <footer className="rounded-base border-2 border-border bg-secondary-background px-4 py-3 text-center text-foreground shadow-shadow xl:shrink-0">
            <p className="text-xs font-heading uppercase tracking-[0.18em] text-foreground/70">KanbanCP © 2026</p>
          </footer>
        </div>
      </ScrollArea>

      <AddProblemDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={(draft) => {
          const newProblem = createProblem(draft, activeBoardId);
          replaceProblems([newProblem, ...problems]);
        }}
        onCreateBulk={(drafts) => {
          const newProblems = drafts.map((draft) => createProblem(draft, activeBoardId));
          replaceProblems([...newProblems, ...problems]);
        }}
      />

        <DetailPanel
          problem={selectedProblem}
          onClose={() => setSelectedId(null)}
          onUpdate={updateProblem}
          onDelete={async (id) => {
            await handleDeleteProblem(id);
            setSelectedId(null);
          }}
        />

      <SolutionPanel
        problem={solutionProblem}
        onClose={() => setSolutionProblemId(null)}
        onUpdate={updateProblem}
      />

      <BoardCreateDialog
        open={createBoardOpen}
        onOpenChange={setCreateBoardOpen}
        onSubmit={async (name, desc, color) => {
          await handleCreateBoard({ name, slug: slugify(name), description: desc, color });
          setCreateBoardOpen(false);
        }}
      />

      <BoardEditDialog
        board={boardToEdit}
        open={editBoardOpen}
        onOpenChange={setEditBoardOpen}
        onSubmit={async (id, name, desc, color) => {
          await handleEditBoard(id, { name, slug: slugify(name), description: desc, color });
          setEditBoardOpen(false);
        }}
      />

      <BoardDeleteDialog
        board={boardToDelete}
        boardCount={visibleBoards.length}
        open={deleteBoardOpen}
        onOpenChange={setDeleteBoardOpen}
        onConfirm={async (id) => {
          await handleDeleteBoard(id);
          setDeleteBoardOpen(false);
        }}
      />

      <MoveToBoardDialog
        problem={problems.find(p => p.id === moveToBoardProblemId) || null}
        boards={visibleBoards}
        open={!!moveToBoardProblemId}
        onOpenChange={(open) => !open && setMoveToBoardProblemId(null)}
        onMove={handleMoveToBoard}
      />

      <AIReviewDialog
        problem={aiReviewProblem}
        board={activeBoard}
        open={!!aiReviewProblemId}
        forceRegenerate={forceRegenerateReview}
        onOpenChange={(open) => {
          if (!open) {
            setAiReviewProblemId(null);
            setForceRegenerateReview(false);
          }
        }}
        onAccept={(problemId, review) => {
          updateProblem(problemId, {
            aiReview: review,
            status: "review"
          });
          setAiReviewProblemId(null);
          setForceRegenerateReview(false);
          toast.success("Review saved successfully");
        }}
        onCancel={() => {
          setAiReviewProblemId(null);
          setForceRegenerateReview(false);
        }}
        />

      <WelcomeDialog
        open={onboarding.loaded && onboarding.welcomeOpen}
        onOpenChange={(open) => {
          if (!open) {
            onboarding.markWelcomeSeen();
            return;
          }
          onboarding.setWelcomeOpen(open);
        }}
        onFinish={onboarding.markWelcomeSeen}
        onOpenGuide={onboarding.openGuide}
      />

      <QuickGuideDialog
        open={onboarding.guideOpen}
        onOpenChange={onboarding.setGuideOpen}
      />

      <SettingsDialog open={settingsOpen} onOpenChange={(open) => {
        setSettingsOpen(open);
        if (!open) {
          void refreshSettings();
        }
      }} />

      <AlertDialog open={!!problemToDeleteId} onOpenChange={(open) => !open && setProblemToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete This Problem</AlertDialogTitle>
            <AlertDialogDescription>
              this action cannot be undone and will delete the problem data from local storage
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-[var(--danger)] text-[var(--danger-foreground)] hover:bg-[var(--danger)]" onClick={async () => {
              if (problemToDeleteId) {
                await handleDeleteProblem(problemToDeleteId);
                setProblemToDeleteId(null);
                toast.success("Problem deleted");
              }
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!reviewToDeleteId} onOpenChange={(open) => !open && setReviewToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete AI Review</AlertDialogTitle>
            <AlertDialogDescription>
              are you sure you want to delete this AI review? you can always generate a new one later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-[var(--danger)] text-[var(--danger-foreground)] hover:bg-[var(--danger)]" onClick={() => {
              if (reviewToDeleteId) {
                updateProblem(reviewToDeleteId, { aiReview: null });
                setReviewToDeleteId(null);
                toast.success("AI review deleted");
              }
            }}>
              delete review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarInset>
  );

  return (
    <TooltipProvider delayDuration={700} skipDelayDuration={0}>
      <SidebarProvider defaultOpen={true}>
        <div className="flex h-dvh w-full bg-background flex-col md:flex-row overflow-hidden">
          <BoardSidebar
            className="h-full z-20 hidden md:flex"
            boards={visibleBoards}
            activeBoardId={pendingBoardId ?? activeBoardId}
            onSelectBoard={handleSelectBoard}
            onAddBoard={() => setCreateBoardOpen(true)}
            onEditBoard={(id) => {
              const board = visibleBoards.find((item) => item.id === id) ?? null
              setBoardToEdit(board)
              setEditBoardOpen(true)
            }}
            onDeleteBoard={(id) => {
              const board = visibleBoards.find((item) => item.id === id) ?? null
              setBoardToDelete(board)
              setDeleteBoardOpen(true)
            }}
          />
          {appContent}
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
