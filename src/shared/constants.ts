import { Difficulty, Status, Board, platforms } from "./types";

export const DEFAULT_BOARD_ID = "board_main";
export const DEFAULT_BOARD: Board = {
  id: DEFAULT_BOARD_ID,
  name: "Main",
  slug: "main",
  description: "Default board",
  color: "#000000",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const STATUS_LABELS: Record<Status, string> = {
  backlog: "Backlog",
  today: "Today",
  review: "Review",
  done: "Done",
};

export const STATUS_COLORS: Record<Status, string> = {
  backlog: "var(--backlog)",
  today: "var(--today)",
  review: "var(--review)",
  done: "var(--done)",
};

export const PLATFORM_LABELS: Record<(typeof platforms)[number], string> = {
  leetcode: "LeetCode",
  codewars: "Codewars",
  hackerrank: "HackerRank",
  codeforces: "Codeforces",
  custom: "Custom",
};

export const PLATFORM_COLORS: Record<(typeof platforms)[number], string> = {
  leetcode: "oklch(86.6% 0.128 72)",
  codewars: "oklch(82.4% 0.11 13)",
  hackerrank: "oklch(84.8% 0.164 132)",
  codeforces: "oklch(85.2% 0.076 302)",
  custom: "oklch(92.4% 0.094 96)",
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "var(--easy)",
  medium: "var(--medium)",
  hard: "var(--hard)",
  unknown: "var(--unknown)",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  unknown: "Unknown",
};
