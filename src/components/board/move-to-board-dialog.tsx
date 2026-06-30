import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel } from "@/components/ui/field-label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Board, Problem } from "@/lib/types";

interface MoveToBoardDialogProps {
  problem: Problem | null;
  boards: Board[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (problemId: string, targetBoardId: string) => Promise<void> | void;
}

export function MoveToBoardDialog({
  problem,
  boards,
  open,
  onOpenChange,
  onMove,
}: MoveToBoardDialogProps) {
  const [targetBoardId, setTargetBoardId] = useState<string>("");
  const [error, setError] = useState("");

  const availableBoards = boards.filter((b) => b.id !== problem?.boardId);

  useEffect(() => {
    if (!open) {
      setTargetBoardId("");
      setError("");
    }
  }, [open]);

  if (!problem) return null;

  const handleMove = async () => {
    if (availableBoards.length === 0) return;

    if (!targetBoardId) {
      setError("target board is required");
      return;
    }

    if (targetBoardId !== problem.boardId) {
      await onMove(problem.id, targetBoardId);
    }
  };

  return (
    <Modal 
      open={open} 
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) {
          setTargetBoardId("");
          setError("");
        }
      }}
      title="Move Problem"
      className="max-h-[85vh] sm:max-w-[425px]"
      contentClassName="flex flex-col overflow-hidden p-0"
      scrollable={false}
    >
          <ScrollArea className="flex-1 min-h-0 w-full bg-background">
          <div className="grid gap-4 p-6 pr-7">
            <div className="grid gap-2">
            <FieldLabel required>Target Board</FieldLabel>
            <Select
              value={targetBoardId || undefined}
              onValueChange={(value) => {
                setTargetBoardId(value);
                setError("");
              }}
            >
            <SelectTrigger className={error ? "border-danger" : ""} aria-invalid={Boolean(error)} aria-describedby={error ? "move-board-error" : undefined}>
              <SelectValue placeholder="Select Board" />
            </SelectTrigger>
              <SelectContent>
                {availableBoards.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableBoards.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No other boards available.
              </p>
            )}
            <FieldError id="move-board-error">{error}</FieldError>
          </div>
          </div>
          </ScrollArea>
          <div className="flex shrink-0 border-t-2 border-border bg-background p-6">
            <Button 
              onClick={handleMove}
              disabled={availableBoards.length === 0}
              className="w-full"
            >
              Move
            </Button>
          </div>
    </Modal>
  );
}
