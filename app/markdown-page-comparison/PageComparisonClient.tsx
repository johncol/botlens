"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PageComparisonEntry, SidebarEntry } from "@/types";
import {
  loadHistory,
  addHistoryEntry,
  removeHistoryEntry,
  PAGE_COMPARISON_KEY,
} from "@/lib/history";
import { HistorySidebar } from "@/components/HistorySidebar";
import { PageSidePanel } from "@/components/PageSidePanel";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";

function toSidebarEntry(e: PageComparisonEntry): SidebarEntry {
  const label =
    [e.leftLabel, e.rightLabel].filter(Boolean).join(" ↔ ") ||
    "Untitled comparison";
  return { id: e.id, label, badge: "comparison", createdAt: e.createdAt };
}

export default function PageComparisonClient() {
  const [history, setHistory] = useState<PageComparisonEntry[]>([]);

  useEffect(() => {
    /** Necessary to avoid hydration mismatches */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loadHistory<PageComparisonEntry>(PAGE_COMPARISON_KEY));
  }, []);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [leftMarkdown, setLeftMarkdown] = useState<string | null>(null);
  const [leftLabel, setLeftLabel] = useState("");
  const [rightMarkdown, setRightMarkdown] = useState<string | null>(null);
  const [rightLabel, setRightLabel] = useState("");

  const [viewMode, setViewMode] = useState<ViewMode>("rendered");

  // Track whether each side was just updated (for auto-save trigger)
  const pendingSave = useRef(false);

  // Auto-save when both sides have content
  const autoSave = useCallback(
    (lm: string, ll: string, rm: string, rl: string) => {
      setHistory((prev) => {
        const updated = addHistoryEntry<PageComparisonEntry>(
          PAGE_COMPARISON_KEY,
          prev,
          {
            leftLabel: ll,
            rightLabel: rl,
            leftMarkdown: lm,
            rightMarkdown: rm,
          },
        );
        setActiveId(updated[0].id);
        return updated;
      });
    },
    [],
  );

  const handleLeftConvert = useCallback(
    (markdown: string, autoLabel: string) => {
      const ll = leftLabel || autoLabel;
      setLeftMarkdown(markdown);
      if (!leftLabel) setLeftLabel(autoLabel);

      if (rightMarkdown !== null) {
        autoSave(markdown, ll, rightMarkdown, rightLabel || "Source B");
      } else {
        pendingSave.current = true;
      }
    },
    [leftLabel, rightMarkdown, rightLabel, autoSave],
  );

  const handleRightConvert = useCallback(
    (markdown: string, autoLabel: string) => {
      const rl = rightLabel || autoLabel;
      setRightMarkdown(markdown);
      if (!rightLabel) setRightLabel(autoLabel);

      if (leftMarkdown !== null) {
        autoSave(leftMarkdown, leftLabel || "Source A", markdown, rl);
      } else {
        pendingSave.current = true;
      }
    },
    [rightLabel, leftMarkdown, leftLabel, autoSave],
  );

  const handleSelect = useCallback(
    (entry: SidebarEntry) => {
      const full = history.find((e) => e.id === entry.id);
      if (!full) return;
      setActiveId(full.id);
      setLeftMarkdown(full.leftMarkdown);
      setLeftLabel(full.leftLabel);
      setRightMarkdown(full.rightMarkdown);
      setRightLabel(full.rightLabel);
    },
    [history],
  );

  const handleRemove = useCallback(
    (id: string) => {
      setHistory((prev) => {
        const updated = removeHistoryEntry<PageComparisonEntry>(
          PAGE_COMPARISON_KEY,
          prev,
          id,
        );
        if (activeId === id) {
          const next = updated[0] ?? null;
          setActiveId(next?.id ?? null);
          if (next) {
            setLeftMarkdown(next.leftMarkdown);
            setLeftLabel(next.leftLabel);
            setRightMarkdown(next.rightMarkdown);
            setRightLabel(next.rightLabel);
          } else {
            setLeftMarkdown(null);
            setLeftLabel("");
            setRightMarkdown(null);
            setRightLabel("");
          }
        }
        return updated;
      });
    },
    [activeId],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <HistorySidebar
          entries={history.map(toSidebarEntry)}
          activeId={activeId}
          emptyMessage="No comparisons yet. Convert both sources to save a comparison."
          onSelect={handleSelect}
          onRemove={handleRemove}
        />

        <main className="flex flex-col flex-1 overflow-hidden p-4 gap-3">
          <div className="flex items-center justify-between shrink-0">
            <ViewToggle value={viewMode} onChange={setViewMode} />
            <p className="text-xs text-muted-foreground">node-html-markdown</p>
          </div>

          <div className="flex flex-1 gap-3 overflow-hidden min-h-0">
            <PageSidePanel
              placeholder="Source A"
              label={leftLabel}
              onLabelChange={setLeftLabel}
              markdown={leftMarkdown}
              onConvertSuccess={handleLeftConvert}
              viewMode={viewMode}
            />
            <PageSidePanel
              placeholder="Source B"
              label={rightLabel}
              onLabelChange={setRightLabel}
              markdown={rightMarkdown}
              onConvertSuccess={handleRightConvert}
              viewMode={viewMode}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
