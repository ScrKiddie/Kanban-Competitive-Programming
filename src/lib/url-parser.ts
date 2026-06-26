import { Platform } from "@/lib/types";

interface ParsedProblemUrl {
  platform: Platform;
  valid: boolean;
  titleHint: string;
}

function titleFromPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments.at(-1) ?? "";
  return decodeURIComponent(last).replace(/[-_]+/g, " ").trim();
}

export function parseProblemUrl(raw: string): ParsedProblemUrl {
  if (!raw.trim()) {
    return { platform: "custom", valid: false, titleHint: "" };
  }

  try {
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./, "");
    const pathname = url.pathname;
    const titleHint = titleFromPath(pathname);

    if (host.includes("leetcode.com") && pathname.includes("/problems/")) {
      return { platform: "leetcode", valid: true, titleHint };
    }

    if (host.includes("codewars.com") && pathname.includes("/kata/")) {
      return { platform: "codewars", valid: true, titleHint };
    }

    if (host.includes("hackerrank.com") && pathname.includes("/challenges/")) {
      return { platform: "hackerrank", valid: true, titleHint };
    }

    if (host.includes("atcoder.jp") && pathname.includes("/tasks/")) {
      return { platform: "custom", valid: true, titleHint };
    }

    if (host.includes("codeforces.com") && (pathname.includes("/problemset/") || pathname.includes("/contest/"))) {
      return { platform: "codeforces", valid: true, titleHint };
    }

    return { platform: "custom", valid: true, titleHint };
  } catch {
    return { platform: "custom", valid: false, titleHint: "" };
  }
}