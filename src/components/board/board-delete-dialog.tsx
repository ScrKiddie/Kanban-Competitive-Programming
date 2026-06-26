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
import { Board } from "@/lib/types";

interface BoardDeleteDialogProps {
  board: Board | null;
  boardCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (boardId: string) => void;
}

export function BoardDeleteDialog({
  board,
  boardCount,
  open,
  onOpenChange,
  onConfirm,
}: BoardDeleteDialogProps) {
  if (!board) return null;

  const isOnlyBoard = boardCount <= 1;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isOnlyBoard ? "Board is protected" : "Delete board?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isOnlyBoard
                ? "You need at least one board. Create another board before deleting this one."
                : `Are you sure you want to delete ${board.name}? This will permanently delete every problem in this board.`}
            </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{isOnlyBoard ? "Got it" : "Cancel"}</AlertDialogCancel>
          {!isOnlyBoard ? (
            <AlertDialogAction
              onClick={() => onConfirm(board.id)}
              className="bg-[var(--danger)] text-[var(--danger-foreground)] hover:bg-[var(--danger)]"
            >
              Delete board
            </AlertDialogAction>
          ) : null}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
