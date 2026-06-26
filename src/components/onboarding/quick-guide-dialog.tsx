import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QUICK_GUIDE_STEPS } from "@/lib/onboarding";

interface QuickGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickGuideDialog({ open, onOpenChange }: QuickGuideDialogProps) {
  return (
    <Modal 
      open={open} 
      onOpenChange={onOpenChange} 
      title="Quick guide"
      className="h-[85vh] sm:max-w-2xl"
      contentClassName="flex flex-col overflow-hidden p-0"
      scrollable={false}
    >
        <ScrollArea className="flex-1 min-h-0 w-full bg-background">
          <div className="p-6 pr-7">
            <p className="text-foreground/80 font-medium mb-6">
              A short overview of how to use KanbanCP without leaving your current board.
            </p>
            <ol className="mb-6 space-y-3 sm:space-y-4">
              {QUICK_GUIDE_STEPS.map((step, index) => (
                <li
                  key={step.id}
                  className="flex gap-2.5 rounded-base border-2 border-border bg-secondary-background p-3 shadow-[2px_2px_0px_0px_var(--border)] sm:gap-3 sm:p-4"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-base border-2 border-border bg-main font-heading text-xs text-main-foreground sm:size-8 sm:text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-heading text-sm leading-tight sm:text-base">{step.title}</h3>
                    <p className="mt-1 text-sm text-foreground/70">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Alert className="bg-yellow-400 text-black border-border">
              <CheckCircle2 className="size-4" />
              <AlertDescription>
                Tip: keep boards focused. For example, use one board for LeetCode patterns, another for contests, and another for general practice.
              </AlertDescription>
            </Alert>

          </div>
        </ScrollArea>
          <div className="flex shrink-0 border-t-2 border-border bg-background p-6">
            <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
              Got it
            </Button>
          </div>
    </Modal>
  );
}
