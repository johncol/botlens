"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addHistoryEntry,
  loadHistory,
  removeHistoryEntry,
} from "@/lib/history";

export type HistoryRecord = { id: string; createdAt: number };

/**
 * Owns the localStorage-backed history list and the currently selected entry.
 * Every comparison tool shares this behaviour, only the storage key and the
 * entry shape differ.
 */
export function useHistory<T extends HistoryRecord>(storageKey: string) {
  const [entries, setEntries] = useState<T[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    /** Loaded after mount so the server and client markup match. */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(loadHistory<T>(storageKey));
  }, [storageKey]);

  const addEntry = useCallback(
    (entry: Omit<T, "id" | "createdAt">) => {
      setEntries((previous) => {
        const updated = addHistoryEntry<T>(storageKey, previous, entry);
        setActiveId(updated[0].id);
        return updated;
      });
    },
    [storageKey],
  );

  /**
   * Removes an entry. When the removed entry was the selected one, the caller
   * is handed the entry that takes its place (or null when none remains) so it
   * can refresh whatever it renders from the selection.
   */
  const removeEntry = useCallback(
    (id: string, onActiveReplaced?: (next: T | null) => void) => {
      setEntries((previous) => {
        const updated = removeHistoryEntry<T>(storageKey, previous, id);
        if (activeId === id) {
          const next = updated[0] ?? null;
          setActiveId(next?.id ?? null);
          onActiveReplaced?.(next);
        }
        return updated;
      });
    },
    [storageKey, activeId],
  );

  const findEntry = useCallback(
    (id: string): T | null => entries.find((entry) => entry.id === id) ?? null,
    [entries],
  );

  const activeEntry = activeId === null ? null : findEntry(activeId);

  return {
    entries,
    activeId,
    activeEntry,
    setActiveId,
    addEntry,
    removeEntry,
    findEntry,
  };
}
