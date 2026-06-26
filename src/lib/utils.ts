import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNowStrict } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeRelativeTime(value: string) {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return `${formatDistanceToNowStrict(date, { addSuffix: true })}`;
  } catch {
    return "—";
  }
}

export function safeDate(value: string) {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("id-ID");
  } catch {
    return "—";
  }
}

export function isQuotaError(error: unknown) {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}