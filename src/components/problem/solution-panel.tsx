import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Problem } from "@/lib/types";
import { SolutionCodeEditor } from "@/components/problem/code-editor";
import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function useDebouncedCallback<T extends (...args: never[]) => void>(callback: T, delay: number) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPending(false);
  };

  const run = (...args: Parameters<T>) => {
    cancel();
    setIsPending(true);
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
      timeoutRef.current = null;
      setIsPending(false);
    }, delay);
  };

  const flush = (...args: Parameters<T>) => {
    cancel();
    callbackRef.current(...args);
  };

  useEffect(() => cancel, []);

  return { run, flush, isPending };
}

export function SolutionPanel({
  problem,
  onClose,
  onUpdate,
}: {
  problem: Problem | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Problem>) => void;
}) {
  const [code, setCode] = useState(problem?.solutionCode ?? "");
  const [language, setLanguage] = useState(problem?.solutionLanguage ?? "python");

  useEffect(() => {
    if (problem) {
      setTimeout(() => {
        setCode(problem.solutionCode ?? "");
        setLanguage(problem.solutionLanguage ?? "python");
      }, 0);
    }
  }, [problem]);

  const codeDebounce = useDebouncedCallback((nextCode: string, nextLang: string) => {
    if (problem) onUpdate(problem.id, { solutionCode: nextCode, solutionLanguage: nextLang });
  }, 800);

  useEffect(() => {
    const flush = () => {
      if (!problem) return;
      codeDebounce.flush(code, language);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };

    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [code, language, codeDebounce, problem]);

  if (!problem) return null;

  return (
    <Modal
      open={Boolean(problem)}
      onOpenChange={(nextOpen) => !nextOpen && onClose()}
      preventDismiss={codeDebounce.isPending}
      isPending={codeDebounce.isPending}
      title={`Solution: ${problem.title}`}
      className="max-w-4xl w-[95vw] sm:w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[85vh] h-[80vh] overflow-hidden flex flex-col"
      contentClassName="p-4 sm:p-6 flex flex-col flex-1 min-h-0 overflow-hidden gap-4"
      scrollable={false}
    >
            {problem.status !== "today" && (
              <Alert className="mb-4 bg-yellow-400 text-black border-border">
                <Info className="size-4" />
                <AlertTitle>Read Only</AlertTitle>
                <AlertDescription>
                  This problem is not in Today status, so the solution cannot be edited. Please drag the card back to Today if you want to make changes.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex-1 flex flex-col overflow-hidden min-h-0 h-full">
              <SolutionCodeEditor
                code={code}
                language={language}
                readOnly={problem.status !== "today"}
                onChange={(nextCode, nextLang) => {
                  if (problem.status !== "today") return;
                  setCode(nextCode);
                  setLanguage(nextLang);
                  codeDebounce.run(nextCode, nextLang);
                }}
              />
            </div>
    </Modal>
  );
}