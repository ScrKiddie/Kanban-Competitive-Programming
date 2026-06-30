import {useEffect, useState} from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Modal } from "@/components/ui/modal";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIReview, Board, Problem } from "@/lib/types";
import { toast } from "sonner";

import { api } from "@/lib/api-client";

const isString = (item: unknown): item is string => typeof item === "string";

interface AIReviewDialogProps {
  problem: Problem | null;
  board: Board | null;
  open: boolean;
  forceRegenerate?: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (problemId: string, review: AIReview) => void;
  onCancel: () => void;
}

export function AIReviewDialog({
  problem,
  open,
  forceRegenerate = false,
  onOpenChange,
  onAccept,
  onCancel,
}: AIReviewDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<AIReview | null>(null);
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);

  const generateReview = async () => {
    if (!problem) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const reviewData = await api.ai.review(problem, problem.solutionCode || "");
      
      const newReview: AIReview = {
        techniques: Array.isArray(reviewData.techniques) ? reviewData.techniques.filter(isString) : [],
        timeComplexity: typeof reviewData.timeComplexity === "string" ? reviewData.timeComplexity : "Unknown",
        spaceComplexity: typeof reviewData.spaceComplexity === "string" ? reviewData.spaceComplexity : "Unknown",
        explanation: typeof reviewData.explanation === "string" ? reviewData.explanation : "No explanation provided.",
        suggestions: Array.isArray(reviewData.suggestions) ? reviewData.suggestions.filter(isString) : [],
        tags: Array.isArray(reviewData.tags) ? reviewData.tags.filter(isString) : [],
        generatedAt: new Date().toISOString(),
        model: reviewData.model || "Unknown",
      };
      
      setReview(newReview);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast.error("Failed to review", {
        description: err instanceof Error ? err.message : "Check your connection and API key",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && problem) {
      if (forceRegenerate && !loading && !review) {
        void generateReview();
      } else if (problem.aiReview && !forceRegenerate) {
        setReview(problem.aiReview);
      } else if (!loading && !error && !review) {
        void generateReview();
      }
    }
  }, [open, problem, forceRegenerate]);

  const handleAccept = () => {
    if (problem && review) {
      if (problem.aiReview && review !== problem.aiReview) {
        setConfirmReplaceOpen(true);
        return;
      }
      confirmAccept();
    }
  };

  const confirmAccept = () => {
    if (problem && review) {
      onAccept(problem.id, review);
      setConfirmReplaceOpen(false);
      setTimeout(() => {
        setReview(null);
        setError(null);
      }, 300);
    }
  };

  const handleCancel = () => {
    onCancel();
    setTimeout(() => {
      setReview(null);
      setError(null);
      setLoading(false);
    }, 300);
  };

  if (!problem) return null;

  const isSavedReview = Boolean(problem.aiReview && review === problem.aiReview);
  const showReviewActions = review && !isSavedReview;

  return (
    <>
    <Modal 
      open={open} 
      onOpenChange={(val) => {
        if (!val) handleCancel();
        onOpenChange(val);
      }}
      title={problem.aiReview && review === problem.aiReview ? "AI Review Result" : "AI Code Review"}
      className="h-[85vh] max-w-2xl sm:max-w-2xl"
      contentClassName="flex flex-col overflow-hidden"
      hideClose={loading}
      preventDismiss={loading}
      scrollable={false}
    >
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-foreground">
              <Loader2 className="size-12 animate-spin mb-4" />
              <p className="font-heading text-lg">Analyzing your code</p>
              <p className="font-base text-sm text-muted-foreground mt-2">Reading techniques, time, and space complexity</p>
            </div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-destructive">
              <AlertCircle className="size-12 mb-4" />
              <p className="font-heading text-lg">Oops! Something went wrong</p>
              <p className="font-base text-sm opacity-80 mt-2 text-center max-w-md">{error}</p>
              <Button onClick={generateReview} className="mt-6" variant="neutral">
                <RefreshCw className="size-4 mr-2" /> Try Again
              </Button>
            </div>
          ) : review ? (
            <ScrollArea className="flex-1 min-h-0 w-full bg-background">
              <div className="space-y-5 p-6 pr-7">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-2 border-border bg-main p-4 text-main-foreground">
                    <p className="mb-2 text-xs font-heading uppercase tracking-wide opacity-80">Time Complexity</p>
                    <p className="font-mono text-xl leading-none">{review.timeComplexity}</p>
                  </Card>
                  <Card className="border-2 border-border bg-secondary-background p-4 text-foreground">
                    <p className="mb-2 text-xs font-heading uppercase tracking-wide text-muted-foreground">Space Complexity</p>
                    <p className="font-mono text-xl leading-none">{review.spaceComplexity}</p>
                  </Card>
                </div>

                <div className="grid gap-3">
                  <Label>Techniques Used</Label>
                  <div className="flex flex-wrap gap-2">
                    {review.techniques.map((tech) => (
                      <Badge key={tech} variant="neutral" className="px-3 py-1 text-sm">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {review.tags.map((tag) => (
                      <Badge key={tag} variant="neutral" className="px-3 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3">
                  <Label>AI Explanation</Label>
                  <Card className="border-2 border-border bg-muted p-4 font-base leading-relaxed">
                    {review.explanation}
                  </Card>
                </div>

                {review.suggestions && review.suggestions.length > 0 && (
                  <div className="grid gap-3">
                    <Label>Suggestions for Improvement</Label>
                    <Card className="border-2 border-border bg-secondary-background p-4 font-base leading-relaxed">
                      <ul className="list-disc space-y-2 pl-5">
                        {review.suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-sm">{suggestion}</li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                )}

                <p className="pt-1 text-right font-mono text-xs text-muted-foreground opacity-60">
                  Model: {review.model}
                </p>
              </div>
            </ScrollArea>
          ) : null}

          {showReviewActions && (
            <div className="flex shrink-0 flex-col gap-3 border-t-2 border-border bg-background p-6 sm:flex-row sm:items-center sm:justify-end">
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button variant="neutral" onClick={generateReview} disabled={loading} className="w-full sm:w-auto">
                  Re-review
                </Button>
                <Button onClick={handleAccept} className="w-full sm:w-auto flex-1">
                  Save Review
                </Button>
              </div>
            </div>
          )}
    </Modal>

    <AlertDialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Overwrite Old AI Review?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will delete the old AI Review result and replace it with this newly generated review. Are you sure?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmReplaceOpen(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmAccept}>Yes, Overwrite Review</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
