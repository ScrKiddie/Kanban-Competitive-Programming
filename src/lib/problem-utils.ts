import { nanoid } from "nanoid";
import { slugify } from "@/lib/slug";
import { Difficulty, Platform, Problem, ProblemDraft, Status } from "@/lib/types";

export function createProblem(draft: ProblemDraft, boardId: string): Problem {
  const now = new Date().toISOString();

  return {
    id: nanoid(),
    title: draft.title.trim(),
    slug: slugify(draft.title),
    url: draft.url.trim(),
    platform: draft.platform,
    difficulty: draft.difficulty,
    status: draft.status,
    note: draft.note || "",
    tags: draft.tags || [],
    solutionCode: "",
    solutionLanguage: "python",
    aiReview: null,
    createdAt: now,
    updatedAt: now,
    boardId,
    githubSyncStatus: "pending",
  };
}

export function sortProblems(problems: Problem[]) {
  return [...problems];
}

export function reorderProblems(current: Problem[], activeId: string, overId: string, overStatus?: Status) {
  const activeIndex = current.findIndex((problem) => problem.id === activeId);

  if (activeIndex === -1) {
    return current;
  }

  if (activeId === overId) {
    return current;
  }

  const activeProblem = current[activeIndex];
  const next = [...current];
  next.splice(activeIndex, 1);

  let targetStatus = activeProblem.status;
  let insertAt = next.length;

  if (overStatus) {
    targetStatus = overStatus;
    const targetIndexes = next
      .map((problem, index) => ({ problem, index }))
      .filter(({ problem }) => problem.status === overStatus);

    insertAt = targetIndexes.length > 0
      ? targetIndexes[targetIndexes.length - 1].index + 1
      : next.length;
  } else {
    const overIndex = next.findIndex((problem) => problem.id === overId);
    if (overIndex === -1) {
      return current;
    }
    
    targetStatus = next[overIndex].status;
    insertAt = overIndex;
  }

  if (targetStatus === activeProblem.status) {
    const tempNext = [...next];
    tempNext.splice(insertAt, 0, activeProblem);
    
    const currentIds = current.map(p => p.id).join(',');
    const tempIds = tempNext.map(p => p.id).join(',');
    
    if (currentIds === tempIds) {
      return current;
    }
  }

  next.splice(insertAt, 0, {
    ...activeProblem,
    status: targetStatus,
    updatedAt: new Date().toISOString(),
  });

  return next;
}

export function matchesFilters(problem: Problem, search: string, platform: Platform | "all", difficulty: Difficulty | "all") {
  const searchMatch = !search.trim() || problem.title.toLowerCase().includes(search.trim().toLowerCase());
  
  let platformMatch = false;
  if (platform === "all") {
    platformMatch = true;
  } else if (platform === "custom") {
    platformMatch = !["leetcode", "codewars", "hackerrank", "codeforces"].includes(problem.platform);
  } else {
    platformMatch = problem.platform === platform;
  }

  const difficultyMatch = difficulty === "all" || problem.difficulty === difficulty;

  return searchMatch && platformMatch && difficultyMatch;
}
