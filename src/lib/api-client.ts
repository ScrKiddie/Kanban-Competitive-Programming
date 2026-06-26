import { fetch } from "@tauri-apps/plugin-http";
import { nanoid } from "nanoid";
import type { AIReview, AppSettings, Board, CatalogResponse, Difficulty, Platform, Problem } from "@/shared";
import { fetchCatalog } from "@/lib/catalog";
import { getDb, mapBoardRow, mapProblemRow, type BoardRow, type ProblemRow } from "@/lib/db";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";
import { scrapeProblem, type ScrapeResponse } from "@/lib/scraper";

interface AuthResponse {
  user?: { id: string; username: string; avatarUrl?: string };
}

type ProblemCreateInput = Omit<Problem, "id" | "createdAt" | "updatedAt"> | Problem;

function now() {
  return new Date().toISOString();
}

function json(value: unknown) {
  return JSON.stringify(value ?? null);
}

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binString);
}

function getFileExtension(language: string): string {
  const map: Record<string, string> = {
    javascript: "js",
    typescript: "ts",
    python: "py",
    cpp: "cpp",
    c: "c",
    java: "java",
    csharp: "cs",
    ruby: "rb",
    go: "go",
    rust: "rs",
    kotlin: "kt",
    swift: "swift",
    php: "php",
    sql: "sql",
    html: "html",
    css: "css",
  };
  return map[language.toLowerCase()] || "txt";
}

function formatSolutionFile(problem: Problem): string {
  const commentChar = ["python", "ruby", "perl", "bash", "yaml"].includes(problem.solutionLanguage?.toLowerCase() || "") ? "#" : "//";
  
  const headers = [
    `${commentChar} Title: ${problem.title}`,
    `${commentChar} Platform: ${problem.platform}`,
    `${commentChar} Difficulty: ${problem.difficulty}`,
    problem.url ? `${commentChar} URL: ${problem.url}` : "",
    `${commentChar} Synced via KanbanCP at: ${new Date().toISOString()}`,
    "",
  ].filter((line) => line !== null && line !== undefined).join("\n");
  
  return headers + "\n" + (problem.solutionCode || "");
}

async function computeSignature(code: string, language: string): Promise<string> {
  const message = `${language}:${code}`;
  try {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}

async function getBoard(id: string) {
  const db = await getDb();
  const rows = await db.select<BoardRow[]>("SELECT * FROM boards WHERE id = $1 LIMIT 1", [id]);
  if (!rows[0]) throw new Error("Board not found");
  return mapBoardRow(rows[0]);
}

async function getProblem(id: string) {
  const db = await getDb();
  const rows = await db.select<ProblemRow[]>("SELECT * FROM problems WHERE id = $1 LIMIT 1", [id]);
  if (!rows[0]) throw new Error("Problem not found");
  return mapProblemRow(rows[0]);
}

function buildReviewPrompt(problem: Problem, solution: string) {
  return [
    "You are a concise competitive programming code reviewer.",
    "Return only valid JSON with this shape:",
    "{\"techniques\":string[],\"timeComplexity\":string,\"spaceComplexity\":string,\"explanation\":string,\"suggestions\":string[],\"tags\":string[]}",
    `Problem: ${problem.title}`,
    `Difficulty: ${problem.difficulty}`,
    `Tags: ${problem.tags.join(", ")}`,
    `Statement/notes:\n${problem.note || "No statement provided."}`,
    `Solution (${problem.solutionLanguage || "unknown"}):\n${solution || "No solution provided."}`,
  ].join("\n\n");
}

function providerHeaders(settings: AppSettings) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${settings.aiApiKey}`,
  };
  if (settings.aiProvider === "openrouter") {
    if (settings.openRouterSiteUrl) headers["HTTP-Referer"] = settings.openRouterSiteUrl;
    if (settings.openRouterAppName) headers["X-Title"] = settings.openRouterAppName;
  }
  return headers;
}

function normalizeAiBaseUrl(settings: AppSettings) {
  const baseUrl = settings.aiBaseUrl || DEFAULT_SETTINGS.aiBaseUrl;
  return baseUrl.replace(/\/$/, "");
}

export const api = {
  auth: {
    me: async (): Promise<AuthResponse> => ({ user: { id: "local", username: "Local User" } }),
    logout: async () => ({}),
  },
  problems: {
    list: async (boardId?: string): Promise<Problem[]> => {
      const db = await getDb();
      const rows = boardId
        ? await db.select<ProblemRow[]>("SELECT * FROM problems WHERE board_id = $1 ORDER BY created_at DESC", [boardId])
        : await db.select<ProblemRow[]>("SELECT * FROM problems ORDER BY created_at DESC");
      return rows.map(mapProblemRow);
    },
    create: async (data: ProblemCreateInput): Promise<Problem> => {
      const db = await getDb();
      const timestamp = now();
      const id = "id" in data ? data.id : nanoid();
      const createdAt = "createdAt" in data ? data.createdAt : timestamp;
      const updatedAt = "updatedAt" in data ? data.updatedAt : timestamp;
      await db.execute(
        `INSERT INTO problems (
          id, board_id, title, slug, url, platform, difficulty, status, note, tags,
          solution_code, solution_language, ai_review, created_at, updated_at,
          github_sync_status, github_synced_at, github_sync_signature
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          id,
          data.boardId,
          data.title,
          data.slug,
          data.url,
          data.platform,
          data.difficulty,
          data.status,
          data.note ?? "",
          json(data.tags ?? []),
          data.solutionCode ?? "",
          data.solutionLanguage ?? "typescript",
          data.aiReview ? json(data.aiReview) : null,
          createdAt,
          updatedAt,
          data.githubSyncStatus ?? null,
          data.githubSyncedAt ?? null,
          data.githubSyncSignature ?? null,
        ],
      );
      return getProblem(id);
    },
    update: async (id: string, data: Partial<Problem>): Promise<Problem> => {
      const db = await getDb();
      const current = await getProblem(id);
      const next = { ...current, ...data, updatedAt: now() };

      if (
        (next.githubSyncStatus === "synced" || next.githubSyncStatus === "outdated") &&
        (data.solutionCode !== undefined || data.solutionLanguage !== undefined)
      ) {
        const newSignature = await computeSignature(next.solutionCode || "", next.solutionLanguage || "typescript");
        if (newSignature === next.githubSyncSignature) {
          next.githubSyncStatus = "synced";
        } else {
          next.githubSyncStatus = "outdated";
        }
      }

      await db.execute(
        `UPDATE problems SET
          board_id = $1, title = $2, slug = $3, url = $4, platform = $5, difficulty = $6,
          status = $7, note = $8, tags = $9, solution_code = $10, solution_language = $11,
          ai_review = $12, updated_at = $13, github_sync_status = $14, github_synced_at = $15,
          github_sync_signature = $16
        WHERE id = $17`,
        [
          next.boardId,
          next.title,
          next.slug,
          next.url,
          next.platform,
          next.difficulty,
          next.status,
          next.note,
          json(next.tags),
          next.solutionCode,
          next.solutionLanguage,
          next.aiReview ? json(next.aiReview) : null,
          next.updatedAt,
          next.githubSyncStatus ?? null,
          next.githubSyncedAt ?? null,
          next.githubSyncSignature ?? null,
          id,
        ],
      );
      return getProblem(id);
    },
    sync: async (id: string): Promise<Problem> => {
      const settings = await getSettings();
      if (!settings.githubToken.trim()) {
        throw new Error("Configure your Personal Access Token in Settings first.");
      }
      if (!settings.githubRepoUrl.trim()) {
        throw new Error("Configure your GitHub Repository in Settings first.");
      }

      const problem = await getProblem(id);
      
      const repoUrl = settings.githubRepoUrl;
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) {
        throw new Error("Invalid GitHub repository URL in Settings.");
      }
      const owner = match[1];
      const repo = match[2].replace(/\.git$/, "");

      const fileExt = getFileExtension(problem.solutionLanguage);
      const platformFolder = problem.platform.toLowerCase().trim();
      const filePath = `${platformFolder}/${problem.slug}.${fileExt}`;

      let sha: string | undefined = undefined;
      try {
        const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `token ${settings.githubToken.trim()}`,
            "User-Agent": "KanbanCP-Client",
          },
        });
        if (checkRes.status === 200) {
          const info = await checkRes.json() as { sha: string };
          sha = info.sha;
        } else if (checkRes.status !== 404) {
          throw new Error(`Failed to check remote file status (${checkRes.status})`);
        }
      } catch (err) {
        if (!(err instanceof Error && err.message.includes("404"))) {
          throw err;
        }
      }

      const fileContent = formatSolutionFile(problem);
      const message = `Sync: ${problem.title} (${problem.platform})`;
      const payload = {
        message,
        content: toBase64(fileContent),
        sha,
      };

      const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
        method: "PUT",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `token ${settings.githubToken.trim()}`,
          "User-Agent": "KanbanCP-Client",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!putRes.ok) {
        let errorDetails = putRes.statusText;
        try {
          const errData = await putRes.json() as { message?: string };
          if (errData && errData.message) {
            errorDetails = errData.message;
          }
        } catch {}
        throw new Error(`GitHub sync failed (${putRes.status}): ${errorDetails}`);
      }

      const signature = await computeSignature(problem.solutionCode || "", problem.solutionLanguage || "typescript");
      const syncedAt = now();

      const db = await getDb();
      await db.execute(
        `UPDATE problems SET github_sync_status = $1, github_synced_at = $2, github_sync_signature = $3 WHERE id = $4`,
        ["synced", syncedAt, signature, id],
      );

      return getProblem(id);
    },
    delete: async (id: string) => {
      const db = await getDb();
      await db.execute("DELETE FROM problems WHERE id = $1", [id]);
      return {};
    },
    clear: async (boardId: string, status: string) => {
      const db = await getDb();
      await db.execute("DELETE FROM problems WHERE board_id = $1 AND status = $2", [boardId, status]);
      return {};
    },
  },
  boards: {
    list: async (): Promise<Board[]> => {
      const db = await getDb();
      const rows = await db.select<BoardRow[]>("SELECT * FROM boards ORDER BY created_at ASC");
      return rows.map(mapBoardRow);
    },
    create: async (data: Omit<Board, "id" | "createdAt" | "updatedAt">): Promise<Board> => {
      const db = await getDb();
      const timestamp = now();
      const id = nanoid();
      await db.execute(
        "INSERT INTO boards (id, name, slug, description, color, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [id, data.name, data.slug, data.description ?? "", data.color ?? "#000000", timestamp, timestamp],
      );
      return getBoard(id);
    },
    update: async (id: string, data: Partial<Board>): Promise<Board> => {
      const db = await getDb();
      const current = await getBoard(id);
      const next = { ...current, ...data, updatedAt: now() };
      await db.execute(
        "UPDATE boards SET name = $1, slug = $2, description = $3, color = $4, updated_at = $5 WHERE id = $6",
        [next.name, next.slug, next.description, next.color, next.updatedAt, id],
      );
      return getBoard(id);
    },
    delete: async (id: string) => {
      const db = await getDb();
      await db.execute("DELETE FROM problems WHERE board_id = $1", [id]);
      await db.execute("DELETE FROM boards WHERE id = $1", [id]);
      return {};
    },
  },
  ai: {
    review: async (problem: Problem, solution: string): Promise<Partial<AIReview> & { model?: string }> => {
      const settings = await getSettings();
      if (!settings.aiApiKey.trim()) {
        throw new Error("Configure your BYOK AI API key in Settings first.");
      }
      const model = settings.aiModel || DEFAULT_SETTINGS.aiModel;
      const response = await fetch(`${normalizeAiBaseUrl(settings)}/chat/completions`, {
        method: "POST",
        headers: providerHeaders(settings),
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: buildReviewPrompt(problem, solution) }],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });
      if (!response.ok) {
        throw new Error(`AI request failed (${response.status})`);
      }
      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error("AI provider returned an empty response.");
      return { ...JSON.parse(content), model };
    },
  },
  catalog: {
    list: (platform: string, page: number, limit: number, search?: string, difficulty?: string): Promise<CatalogResponse> => {
      return fetchCatalog({ platform: platform as Platform, page, limit, search, difficulty: difficulty as Difficulty | "all" | undefined });
    },
  },
  scrape: (url: string, signal?: AbortSignal): Promise<ScrapeResponse> => {
    if (signal?.aborted) {
      return Promise.reject(new DOMException("Request aborted", "AbortError"));
    }
    return scrapeProblem(url);
  },
};
