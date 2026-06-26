import { Board } from "@/lib/types";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function generateUniqueSlug(
  name: string,
  existingSlugs: string[],
): string {
  const baseSlug = generateSlug(name);
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let uniqueSlug = `${baseSlug}-${counter}`;
  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}

export function createBoard(
  name: string,
  existingSlugs: string[],
  description: string = "",
  color: string = "blue",
): Board {
  const now = new Date().toISOString();
  return {
    id: `board_${crypto.randomUUID()}`,
    name: name.trim(),
    slug: generateUniqueSlug(name, existingSlugs),
    description: description.trim(),
    color,
    createdAt: now,
    updatedAt: now,
  };
}

export function canDeleteBoard(
  boards: Board[],
): { ok: boolean; reason?: string } {
  if (boards.length <= 1) {
    return { ok: false, reason: "Cannot delete the only remaining board" };
  }

  return { ok: true };
}
