"use client";

import { useState, useEffect, useCallback } from "react";
import { HistoryEntry, ConversionResult, SidebarEntry } from "@/types";
import {
  loadHistory,
  addHistoryEntry,
  removeHistoryEntry,
  LIBRARY_COMPARISON_KEY,
} from "@/lib/history";
import { HistorySidebar } from "@/components/HistorySidebar";
import { InputBar } from "@/components/InputBar";
import { MarkdownPanel } from "@/components/MarkdownPanel";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";

function toSidebarEntry(e: HistoryEntry): SidebarEntry {
  return { id: e.id, label: e.label, badge: e.type, createdAt: e.createdAt };
}

export default function LibraryComparisonClient() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    /** Necessary to avoid hydration mismatches */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loadHistory<HistoryEntry>(LIBRARY_COMPARISON_KEY));
  }, []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<ConversionResult | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("rendered");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = useCallback(
    async (params: {
      url?: string;
      html?: string;
      label: string;
      type: "url" | "snippet";
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            params.url ? { url: params.url } : { html: params.html },
          ),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Conversion failed");
          return;
        }

        const result: ConversionResult = {
          turndown: data.turndown,
          nodeHtmlMarkdown: data.nodeHtmlMarkdown,
        };
        setCurrentResult(result);

        setHistory((prev) => {
          const updated = addHistoryEntry<HistoryEntry>(
            LIBRARY_COMPARISON_KEY,
            prev,
            {
              label: params.label,
              type: params.type,
              result,
            },
          );
          setActiveId(updated[0].id);
          return updated;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const handleSelect = useCallback(
    (entry: SidebarEntry) => {
      const full = history.find((e) => e.id === entry.id);
      if (!full) return;
      setActiveId(full.id);
      setCurrentResult(full.result);
      setError(null);
    },
    [history],
  );

  const handleRemove = useCallback(
    (id: string) => {
      setHistory((prev) => {
        const updated = removeHistoryEntry<HistoryEntry>(
          LIBRARY_COMPARISON_KEY,
          prev,
          id,
        );
        if (activeId === id) {
          const next = updated[0] ?? null;
          setActiveId(next?.id ?? null);
          setCurrentResult(next?.result ?? null);
        }
        return updated;
      });
    },
    [activeId],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <InputBar onConvert={handleConvert} isLoading={isLoading} error={error} />
      <div className="flex flex-1 overflow-hidden">
        <HistorySidebar
          entries={history.map(toSidebarEntry)}
          activeId={activeId}
          emptyMessage="No conversions yet. Submit a URL or HTML snippet above."
          onSelect={handleSelect}
          onRemove={handleRemove}
        />
        <main className="flex flex-col flex-1 overflow-hidden p-4 gap-3">
          {currentResult ? (
            <>
              <div className="flex items-center justify-between shrink-0">
                <ViewToggle value={viewMode} onChange={setViewMode} />
                <p className="text-xs text-muted-foreground truncate max-w-xs">
                  {history.find((e) => e.id === activeId)?.label ?? ""}
                </p>
              </div>
              <div className="flex flex-1 gap-3 overflow-hidden min-h-0">
                <MarkdownPanel
                  title="Turndown"
                  markdown={currentResult.turndown}
                  viewMode={viewMode}
                />
                <MarkdownPanel
                  title="node-html-markdown"
                  markdown={currentResult.nodeHtmlMarkdown}
                  viewMode={viewMode}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">
                  Enter a URL or paste HTML above to compare converters.
                </p>
                <p className="text-xs text-muted-foreground">
                  Turndown and node-html-markdown results appear side by side.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
