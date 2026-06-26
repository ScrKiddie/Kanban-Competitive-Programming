export const platforms = [
  "leetcode",
  "codewars",
  "hackerrank",
  "codeforces",
  "custom",
] as const;

export const difficulties = ["easy", "medium", "hard", "unknown"] as const;

export const statuses = ["backlog", "today", "review", "done"] as const;

export type Platform = (typeof platforms)[number] | (string & {});
export type Difficulty = (typeof difficulties)[number];
export type Status = (typeof statuses)[number];
export type AIProvider = "groq" | "openrouter" | "openai-compatible";

export interface AIReview {
  techniques: string[];
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
  suggestions: string[];
  tags: string[];
  generatedAt: string;
  model: string;
}

export type GithubSyncStatus = "pending" | "syncing" | "synced" | "failed" | "outdated";

export interface Problem {
  id: string;
  title: string;
  slug: string;
  url: string;
  platform: Platform;
  difficulty: Difficulty;
  status: Status;
  note: string;
  tags: string[];
  solutionCode: string;
  solutionLanguage: string;
  aiReview: AIReview | null;
  createdAt: string;
  updatedAt: string;
  boardId: string;
  githubSyncStatus?: GithubSyncStatus;
  githubSyncedAt?: string | null;
  githubSyncSignature?: string | null;
}

export interface Board {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  aiProvider: AIProvider;
  aiApiKey: string;
  aiModel: string;
  aiBaseUrl: string;
  openRouterSiteUrl: string;
  openRouterAppName: string;
  githubRepoUrl: string;
  githubToken: string;
}

export interface ProblemDraft {
  title: string;
  url: string;
  platform: Platform;
  difficulty: Difficulty;
  status: Status;
  note?: string;
  tags?: string[];
}

export type SaveState = "idle" | "saving" | "saved" | "error";