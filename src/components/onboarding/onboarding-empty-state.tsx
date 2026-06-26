import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingEmptyStateProps {
  boardName: string;
  hasFilters: boolean;
  onAddProblem: () => void;
  onOpenGuide: () => void;
}

export function OnboardingEmptyState({
  boardName,
  hasFilters,
  onAddProblem,
  onOpenGuide,
}: OnboardingEmptyStateProps) {
  if (hasFilters) {
    return null;
  }

  return (
    <div className="p-5 md:p-6">
      <p className="text-xs font-heading uppercase tracking-[0.18em] text-foreground/60">Empty board</p>
      <h2 className="mt-2 text-2xl font-heading leading-tight">Start tracking problems in {boardName}</h2>
      <p className="mt-2 max-w-2xl text-sm text-foreground/70">
        Add your first coding problem, then move it from Backlog to Today, Review, and Done as you practice.
      </p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="neutral" onClick={onOpenGuide}>
          <BookOpen className="size-4" />
          View quick guide
        </Button>
        <Button type="button" onClick={onAddProblem}>
          <Plus className="size-4" />
          Add first problem
        </Button>
      </div>
    </div>
  );
}