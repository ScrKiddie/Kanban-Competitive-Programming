import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FieldLabel } from "@/components/ui/field-label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { validateBoardName } from "@/lib/validators";
import { Board } from "@/lib/types";

interface BoardEditDialogProps {
  board: Board | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (boardId: string, name: string, description: string, color: string) => void;
}

const BOARD_DOT_COLOR = "#000000";

export function BoardEditDialog({
  board,
  open,
  onOpenChange,
  onSubmit,
}: BoardEditDialogProps) {
  const [name, setName] = useState(() => board?.name ?? "");
  const [description, setDescription] = useState(() => board?.description ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (board) {
      setTimeout(() => {
        setName(board.name);
        setDescription(board.description);
        setError("");
      }, 0);
    }
  }, [board, open]);

  const handleSubmit = () => {
    if (!board) return;
    
    const err = validateBoardName(name);
    if (err) {
      setError(err);
      return;
    }
    
    onSubmit(board.id, name, description, BOARD_DOT_COLOR);
  };

  if (!board) return null;

  return (
    <Modal 
      open={open} 
      onOpenChange={onOpenChange}
      title="Edit Board"
      className="max-h-[85vh] sm:max-w-[425px]"
      contentClassName="flex flex-col overflow-hidden p-0"
      scrollable={false}
    >
          <ScrollArea className="flex-1 min-h-0 w-full bg-background">
          <div className="grid gap-4 p-6 pr-7">
            <div className="grid gap-2">
            <FieldLabel htmlFor="name" required>Board Name</FieldLabel>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              className={error ? "border-danger" : ""}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "board-edit-name-error" : undefined}
            />
            <FieldError id="board-edit-name-error">{error}</FieldError>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="desc">Description (Optional)</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <Alert className="bg-yellow-400 text-black border-border mt-2">
              <Info className="size-4" />
              <AlertTitle>AI Review Rule</AlertTitle>
              <AlertDescription>
                AI will use this description as a strict rule when reviewing code solutions in this board. Leave blank if not needed.
              </AlertDescription>
            </Alert>
          </div>
          </div>
          </ScrollArea>
          <div className="flex shrink-0 border-t-2 border-border bg-background p-6">
            <Button onClick={handleSubmit} className="w-full">Save Changes</Button>
          </div>
    </Modal>
  );
}
