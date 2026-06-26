import type { Platform, Difficulty } from "./types";

export interface CatalogProblem {
  id: string;
  platform: Platform;
  title: string;
  url: string;
  difficulty: Difficulty;
  acceptanceRate?: number;
  tags: string[];
}

export interface CatalogResponse {
  problems: CatalogProblem[];
  total: number;
  hasMore: boolean;
}
