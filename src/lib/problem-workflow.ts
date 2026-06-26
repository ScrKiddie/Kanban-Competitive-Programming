import { Problem, Status } from "./types";

export interface TransitionResult {
  ok: boolean;
  reason?: string;
  description?: string;
}

export function canRequestAIReview(problem: Problem): TransitionResult {
  if (!problem.title?.trim() || !problem.url?.trim() || !problem.note?.trim() || !problem.solutionCode?.trim()) {
    return {
      ok: false,
      reason: "Cannot be reviewed",
      description: "Title, URL, Notes, and Solution Code must be filled first.",
    };
  }
  return { ok: true };
}

export function canTransitionProblem(problem: Problem, nextStatus: Status): TransitionResult {
  if (nextStatus === "backlog" || problem.status === nextStatus) {
    return { ok: true };
  }

  if (["today", "review", "done"].includes(nextStatus)) {
    if (!problem.title?.trim() || !problem.url?.trim() || !problem.note?.trim()) {
      return { 
        ok: false, 
        reason: `Cannot move to ${nextStatus}`,
        description: "Title, URL, and Notes must be filled first." 
      };
    }
  }

  if (["review", "done"].includes(nextStatus)) {
    if (!problem.solutionCode?.trim()) {
      return { 
        ok: false, 
        reason: `Cannot move to ${nextStatus}`,
        description: "Solution Code must be filled first." 
      };
    }
  }

  if (nextStatus === "done") {
    if (!problem.aiReview) {
      return { 
        ok: false, 
        reason: "Cannot move to Done",
        description: "Problem must be reviewed by AI first." 
      };
    }
  }

  return { ok: true };
}
