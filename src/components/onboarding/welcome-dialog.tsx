import { KanbanSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish: () => void;
  onOpenGuide: () => void;
}

export function WelcomeDialog({
  open,
  onOpenChange,
  onFinish,
  onOpenGuide,
}: WelcomeDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Welcome to KanbanCP"
      className="max-h-[85vh]"
      contentClassName="flex flex-col overflow-hidden p-0"
      scrollable={false}
    >
        <ScrollArea className="flex-1 min-h-0 w-full bg-background">
          <div className="border-b-2 border-border bg-main px-6 py-4 sm:py-6 text-main-foreground">
            <p className="text-sm font-base sm:text-base opacity-90">
              Track coding problems, organize practice boards, and move every solution through a simple kanban workflow.
            </p>
          </div>

          <div className="grid gap-3 p-6 sm:grid-cols-2">
            <div className="rounded-base border-2 border-border bg-secondary-background p-3 shadow-[2px_2px_0px_0px_var(--border)] sm:p-4">
              <KanbanSquare className="mb-3 size-5" />
              <h3 className="font-heading text-base">Start with a board</h3>
              <p className="mt-1 text-sm text-foreground/70">
                Keep at least one board, then add or remove boards as your practice topics change.
              </p>
            </div>
            <div className="rounded-base border-2 border-border bg-secondary-background p-3 shadow-[2px_2px_0px_0px_var(--border)] sm:p-4">
              <Sparkles className="mb-3 size-5" />
              <h3 className="font-heading text-base">Build your routine</h3>
              <p className="mt-1 text-sm text-foreground/70">
                Add problems, drag them across statuses, save solutions, and review your progress.
              </p>
            </div>
          </div>
        </ScrollArea>
          <div className="flex shrink-0 flex-col-reverse gap-3 border-t-2 border-border bg-background p-6 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="neutral"
              className="w-full sm:w-auto"
              onClick={() => {
                onFinish();
                onOpenGuide();
              }}
            >
              View quick guide
            </Button>
            <Button type="button" className="w-full sm:w-auto" onClick={onFinish}>
              Start practicing
            </Button>
          </div>
    </Modal>
  );
}
