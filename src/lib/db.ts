import Database from "@tauri-apps/plugin-sql";
import { DEFAULT_BOARD } from "@/lib/constants";
import type { AIReview, Board, Problem } from "@/lib/types";

let dbInstance: Database | null = null;
let initPromise: Promise<void> | null = null;

type ProblemRow = {
  id: string;
  board_id: string;
  title: string;
  slug: string;
  url: string;
  platform: Problem["platform"];
  difficulty: Problem["difficulty"];
  status: Problem["status"];
  note: string | null;
  tags: string | null;
  solution_code: string | null;
  solution_language: string | null;
  ai_review: string | null;
  created_at: string;
  updated_at: string;
  github_sync_status: Problem["githubSyncStatus"] | null;
  github_synced_at: string | null;
  github_sync_signature: string | null;
};

type BoardRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
};

async function loadDb() {
  if (!dbInstance) {
    dbInstance = await Database.load("sqlite:brickcp.db");
  }
  return dbInstance;
}

async function ensureSchema() {
  const db = await loadDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '#000000',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS problems (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      url TEXT NOT NULL,
      platform TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      solution_code TEXT NOT NULL DEFAULT '',
      solution_language TEXT NOT NULL DEFAULT 'typescript',
      ai_review TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      github_sync_status TEXT,
      github_synced_at TEXT,
      github_sync_signature TEXT,
      FOREIGN KEY(board_id) REFERENCES boards(id) ON DELETE CASCADE
    )
  `);

  const rows = await db.select<{ count: number | string }[]>("SELECT COUNT(*) as count FROM boards");
  if (Number(rows[0]?.count ?? 0) === 0) {
    const now = new Date().toISOString();
    await db.execute(
      "INSERT INTO boards (id, name, slug, description, color, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [DEFAULT_BOARD.id, DEFAULT_BOARD.name, DEFAULT_BOARD.slug, DEFAULT_BOARD.description, DEFAULT_BOARD.color, now, now],
    );
  }

  await db.execute("DELETE FROM problems WHERE board_id NOT IN (SELECT id FROM boards)");
}

export async function initDb() {
  if (!initPromise) {
    initPromise = ensureSchema().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  await initPromise;
}

export async function getDb() {
  await initDb();
  return loadDb();
}

export function mapBoardRow(row: BoardRow): Board {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    color: row.color ?? "#000000",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseReview(value: string | null): AIReview | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as AIReview;
  } catch {
    return null;
  }
}

export function mapProblemRow(row: ProblemRow): Problem {
  return {
    id: row.id,
    boardId: row.board_id,
    title: row.title,
    slug: row.slug,
    url: row.url,
    platform: row.platform,
    difficulty: row.difficulty,
    status: row.status,
    note: row.note ?? "",
    tags: parseJsonArray(row.tags),
    solutionCode: row.solution_code ?? "",
    solutionLanguage: row.solution_language ?? "typescript",
    aiReview: parseReview(row.ai_review),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    githubSyncStatus: row.github_sync_status ?? undefined,
    githubSyncedAt: row.github_synced_at,
    githubSyncSignature: row.github_sync_signature,
  };
}

export type { BoardRow, ProblemRow };
