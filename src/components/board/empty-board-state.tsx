import { Board } from "@/lib/types";
import { FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyBoardStateProps {
  board: Board;
  onAddProblem: () => void;
}

export function EmptyBoardState({ board, onAddProblem }: EmptyBoardStateProps) {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full bg-muted"
        style={{ color: "#000000" }}
      >
        <FolderKanban className="h-10 w-10 opacity-50" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Empty Board</h3>
        <p className="text-sm text-muted-foreground max-w-[250px]">
          No problems in board: {board.name} yet. Add your first problem
          to start tracking.
        </p>
      </div>
      <Button onClick={onAddProblem} className="mt-4">
        Add Problem
      </Button>
    </div>
  );
}
