import { fetch } from "@tauri-apps/plugin-http";
import type { CatalogProblem, CatalogResponse, Difficulty, Platform } from "@/shared";

let codeforcesCache: CatalogProblem[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 1000 * 60 * 60 * 24;

export interface CatalogQueryParams {
  platform: Platform;
  page: number;
  limit: number;
  search?: string;
  difficulty?: Difficulty | "all";
}

async function fetchLeetCode(params: CatalogQueryParams): Promise<CatalogResponse> {
  const { page, limit, search, difficulty } = params;
  const skip = (page - 1) * limit;
  const filters: Record<string, string> = {};

  if (search) filters.searchKeywords = search;
  if (difficulty === "easy") filters.difficulty = "EASY";
  if (difficulty === "medium") filters.difficulty = "MEDIUM";
  if (difficulty === "hard") filters.difficulty = "HARD";

  const query = `
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
        totalNum
        questions: data {
          acRate
          difficulty
          title
          titleSlug
          topicTags { name }
        }
      }
    }
  `;

  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { categorySlug: "", skip, limit, filters } }),
  });
  const json = await response.json() as {
    data?: { problemsetQuestionList?: { totalNum: number; questions: Array<{ acRate: number; difficulty: string; title: string; titleSlug: string; topicTags: Array<{ name: string }> }> } };
  };
  const data = json.data?.problemsetQuestionList;
  if (!data) return { problems: [], total: 0, hasMore: false };

  const problems = data.questions.map<CatalogProblem>((question) => ({
    id: `leetcode-${question.titleSlug}`,
    platform: "leetcode",
    title: question.title,
    url: `https://leetcode.com/problems/${question.titleSlug}/`,
    difficulty: question.difficulty.toLowerCase() as Difficulty,
    acceptanceRate: Math.round(question.acRate * 10) / 10,
    tags: question.topicTags.map((tag) => tag.name),
  }));

  return { problems, total: data.totalNum, hasMore: skip + problems.length < data.totalNum };
}

async function fetchCodeforces(params: CatalogQueryParams): Promise<CatalogResponse> {
  const { page, limit, search, difficulty } = params;
  if (!codeforcesCache || Date.now() - lastCacheUpdate > CACHE_TTL) {
    const response = await fetch("https://codeforces.com/api/problemset.problems");
    const json = await response.json() as { status: string; result?: { problems: Array<{ contestId?: number; index: string; name: string; rating?: number; tags?: string[] }> } };
    codeforcesCache = json.status === "OK" && json.result
      ? json.result.problems.map<CatalogProblem>((problem) => {
        let mappedDifficulty: Difficulty = "unknown";
        if (problem.rating) {
          if (problem.rating <= 1200) mappedDifficulty = "easy";
          else if (problem.rating <= 1800) mappedDifficulty = "medium";
          else mappedDifficulty = "hard";
        }
        return {
          id: `codeforces-${problem.contestId}-${problem.index}`,
          platform: "codeforces",
          title: `${problem.contestId}${problem.index} - ${problem.name}`,
          url: `https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`,
          difficulty: mappedDifficulty,
          tags: problem.tags ?? [],
        };
      })
      : [];
    lastCacheUpdate = Date.now();
  }

  let filtered = codeforcesCache;
  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter((problem) => problem.title.toLowerCase().includes(query));
  }
  if (difficulty && difficulty !== "all") {
    filtered = filtered.filter((problem) => problem.difficulty === difficulty);
  }

  const start = (page - 1) * limit;
  const problems = filtered.slice(start, start + limit);
  return { problems, total: filtered.length, hasMore: start + problems.length < filtered.length };
}

async function fetchHackerRank(params: CatalogQueryParams): Promise<CatalogResponse> {
  const { page, limit, search, difficulty } = params;
  const offset = (page - 1) * limit;
  const diffQuery = difficulty && difficulty !== "all" ? `&filters%5Bdifficulty%5D%5B%5D=${difficulty}` : "";
  const searchQuery = search ? `&filters%5Bterm%5D=${encodeURIComponent(search)}` : "";
  const url = `https://www.hackerrank.com/rest/contests/master/tracks/algorithms/challenges?offset=${offset}&limit=${limit}${searchQuery}${diffQuery}`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const json = await response.json() as { total?: number; models?: Array<{ slug: string; name: string; difficulty_name?: string; success_ratio?: number; track?: { name?: string }; primary_contest?: { name?: string } }> };
  if (!json.models) return { problems: [], total: 0, hasMore: false };

  const problems = json.models.map<CatalogProblem>((model) => ({
    id: `hackerrank-${model.slug}`,
    platform: "hackerrank",
    title: model.name,
    url: `https://www.hackerrank.com/challenges/${model.slug}/problem`,
    difficulty: (model.difficulty_name ?? "unknown").toLowerCase() as Difficulty,
    acceptanceRate: Math.round((model.success_ratio ?? 0) * 1000) / 10,
    tags: [model.track?.name, model.primary_contest?.name].filter((tag): tag is string => Boolean(tag)),
  }));

  const total = json.total ?? problems.length;
  return { problems, total, hasMore: offset + problems.length < total };
}

export async function fetchCatalog(params: CatalogQueryParams): Promise<CatalogResponse> {
  switch (params.platform) {
    case "leetcode":
      return fetchLeetCode(params);
    case "codeforces":
      return fetchCodeforces(params);
    case "hackerrank":
      return fetchHackerRank(params);
    default:
      return { problems: [], total: 0, hasMore: false };
  }
}
