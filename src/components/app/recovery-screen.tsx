import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function RecoveryScreen({ onReset }: { onReset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="max-w-xl bg-card p-8 text-center">
        <p className="text-sm font-black uppercase tracking-[0.2em]">recovery</p>
        <h1 className="mt-2 text-4xl font-black">local data looks broken</h1>
        <p className="mt-4 text-base font-bold">KanbanCP can&apos;t safely read the saved data right now. you can reset local data and start fresh</p>
        <div className="mt-6 flex justify-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-[var(--danger)] text-[var(--danger-foreground)]">reset local data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset All Local Data</AlertDialogTitle>
                <AlertDialogDescription>
                  the corrupted data will be removed from this browser and cannot be recovered
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-[var(--danger)] text-[var(--danger-foreground)]" onClick={onReset}>Reset Now</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>
    </main>
  );
}
