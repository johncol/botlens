"use client";

import { useState, useCallback } from "react";
import { HistoryEntry, ConversionResult, SidebarEntry } from "@/types";
import { LIBRARY_COMPARISON_KEY } from "@/lib/history";
import { useHistory } from "@/hooks/use-history";
import { useJsonRequest } from "@/hooks/use-json-request";
import { ComparisonWorkspace } from "@/components/ComparisonWorkspace";
import { EmptyState } from "@/components/EmptyState";
import { InputBar } from "@/components/InputBar";
import { MarkdownPanel } from "@/components/MarkdownPanel";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";

function toSidebarEntry(e: HistoryEntry): SidebarEntry {
  return { id: e.id, label: e.label, badge: e.type, createdAt: e.createdAt };
}

export default function LibraryComparisonClient() {
  const history = useHistory<HistoryEntry>(LIBRARY_COMPARISON_KEY);
  const [currentResult, setCurrentResult] = useState<ConversionResult | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("rendered");
  const { isLoading, error, setError, send } = useJsonRequest<ConversionResult>(
    "/api/convert",
    "Conversion failed",
  );

  const { addEntry, removeEntry, findEntry, setActiveId } = history;

  const handleConvert = useCallback(
    async (params: {
      url?: string;
      html?: string;
      label: string;
      type: "url" | "snippet";
    }) => {
      const data = await send(
        params.url ? { url: params.url } : { html: params.html },
      );
      if (!data) {
        return;
      }

      const result: ConversionResult = {
        turndown: data.turndown,
        nodeHtmlMarkdown: data.nodeHtmlMarkdown,
      };
      setCurrentResult(result);
      addEntry({ label: params.label, type: params.type, result });
    },
    [send, addEntry],
  );

  const handleSelect = useCallback(
    (entry: SidebarEntry) => {
      const full = findEntry(entry.id);
      if (!full) {
        return;
      }
      setActiveId(full.id);
      setCurrentResult(full.result);
      setError(null);
    },
    [findEntry, setActiveId, setError],
  );

  const handleRemove = useCallback(
    (id: string) => {
      removeEntry(id, (next) => setCurrentResult(next?.result ?? null));
    },
    [removeEntry],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <InputBar onConvert={handleConvert} isLoading={isLoading} error={error} />
      <ComparisonWorkspace
        entries={history.entries.map(toSidebarEntry)}
        activeId={history.activeId}
        emptyMessage="No conversions yet. Submit a URL or HTML snippet above."
        onSelect={handleSelect}
        onRemove={handleRemove}
      >
        {currentResult ? (
          <>
            <div className="flex items-center justify-between shrink-0">
              <ViewToggle value={viewMode} onChange={setViewMode} />
              <p className="text-xs text-muted-foreground truncate max-w-xs">
                {history.activeEntry?.label ?? ""}
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
          <EmptyState
            message="Enter a URL or paste HTML above to compare converters."
            hint="Turndown and node-html-markdown results appear side by side."
          />
        )}
      </ComparisonWorkspace>
    </div>
  );
}
