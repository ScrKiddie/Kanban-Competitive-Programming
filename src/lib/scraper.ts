import { fetch } from "@tauri-apps/plugin-http";
import TurndownService from "turndown";
import type { Difficulty, Platform } from "@/lib/types";

export interface ScrapeResponse {
  error?: string;
  title?: string;
  platform?: Platform;
  difficulty?: Difficulty;
  description?: string;
  note?: string;
  tags?: string[];
  slug?: string;
  url?: string;
  summary?: string;
}

export function parseProblemUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    if (hostname.includes("leetcode.com")) {
      const match = parsedUrl.pathname.match(/\/problems\/([^/]+)/);
      if (match) return { platform: "leetcode" as const, slug: match[1] };
    } else if (hostname.includes("codewars.com")) {
      const match = parsedUrl.pathname.match(/\/kata\/([^/]+)/);
      if (match) return { platform: "codewars" as const, slug: match[1] };
    } else if (hostname.includes("hackerrank.com")) {
      const match = parsedUrl.pathname.match(/\/challenges\/([^/]+)/);
      if (match) return { platform: "hackerrank" as const, slug: match[1] };
    } else if (hostname.includes("codeforces.com")) {
      const match = parsedUrl.pathname.match(/\/problemset\/problem\/([^/]+)\/([^/]+)/);
      if (match) return { platform: "codeforces" as const, slug: `${match[1]}${match[2]}` };
    }
  } catch {}
  return { platform: "custom" as const, slug: `custom-${Date.now()}` };
}

async function fetchLeetCodeData(slug: string) {
  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
    body: JSON.stringify({
      query: `
        query questionData($titleSlug: String!) {
          question(titleSlug: $titleSlug) {
            title
            difficulty
            content
            topicTags { name }
          }
        }
      `,
      variables: { titleSlug: slug },
    }),
  });
  if (!response.ok) throw new Error("Failed to fetch from LeetCode");
  const json = await response.json() as { data?: { question?: { title: string; difficulty: string; content: string; topicTags?: Array<{ name: string }> } } };
  const question = json.data?.question;
  if (!question) throw new Error("Problem not found");

  const td = new TurndownService();
  return {
    title: question.title,
    difficulty: question.difficulty.toLowerCase() as Difficulty,
    note: td.turndown(question.content),
    tags: question.topicTags?.map((tag) => tag.name) ?? [],
  };
}

async function fetchCodewarsData(slug: string) {
  const response = await fetch(`https://www.codewars.com/api/v1/code-challenges/${slug}`);
  if (!response.ok) throw new Error("Failed to fetch from Codewars");
  const json = await response.json() as { name: string; description?: string; rank?: { name?: string }; tags?: string[] };

  let difficulty: Difficulty = "unknown";
  if (json.rank?.name) {
    const kyu = Number.parseInt(json.rank.name, 10);
    if (kyu >= 7) difficulty = "easy";
    else if (kyu >= 5) difficulty = "medium";
    else difficulty = "hard";
  }

  const td = new TurndownService();
  return {
    title: json.name,
    difficulty,
    note: td.turndown(json.description ?? ""),
    tags: json.tags ?? [],
  };
}

async function fetchWithJina(url: string) {
  const response = await fetch(`https://r.jina.ai/${url}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Jina fetch failed");
  const json = await response.json() as { data?: { title?: string; content?: string } };
  return {
    title: json.data?.title ?? "Unknown Title",
    difficulty: "unknown" as Difficulty,
    note: json.data?.content ?? "",
    tags: [],
  };
}

export async function scrapeProblem(url: string): Promise<ScrapeResponse> {
  const parsed = parseProblemUrl(url);
  const data = parsed.platform === "leetcode"
    ? await fetchLeetCodeData(parsed.slug)
    : parsed.platform === "codewars"
      ? await fetchCodewarsData(parsed.slug)
      : await fetchWithJina(url);

  return {
    ...data,
    platform: parsed.platform,
    slug: parsed.slug,
    url,
    summary: data.note.slice(0, 280),
  };
}
