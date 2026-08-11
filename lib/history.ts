export const LIBRARY_COMPARISON_KEY = "botlens-library-comparison";
export const PAGE_COMPARISON_KEY = "botlens-page-comparison";
export const CRAWLER_COMPARISON_KEY = "botlens-crawler-comparison";
export const ENV_COMPARISON_KEY = "botlens-env-vs-env";

const MAX_HISTORY_ENTRIES = 50;

export function loadHistory<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory<T>(key: string, entries: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(entries));
}

export function addHistoryEntry<T extends { id: string; createdAt: number }>(
  key: string,
  entries: T[],
  entry: Omit<T, "id" | "createdAt">,
): T[] {
  const newEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  } as T;
  const updated = [newEntry, ...entries].slice(0, MAX_HISTORY_ENTRIES);
  saveHistory(key, updated);
  return updated;
}

export function removeHistoryEntry<T extends { id: string }>(
  key: string,
  entries: T[],
  id: string,
): T[] {
  const updated = entries.filter((e) => e.id !== id);
  saveHistory(key, updated);
  return updated;
}
