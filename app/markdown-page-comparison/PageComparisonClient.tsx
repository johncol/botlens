"use client";

import { useState, useCallback } from "react";
import { PageComparisonEntry, SidebarEntry } from "@/types";
import { PAGE_COMPARISON_KEY } from "@/lib/history";
import { useHistory } from "@/hooks/use-history";
import { ComparisonWorkspace } from "@/components/ComparisonWorkspace";
import { PageSidePanel } from "@/components/PageSidePanel";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";

function toSidebarEntry(e: PageComparisonEntry): SidebarEntry {
  const label =
    [e.leftLabel, e.rightLabel].filter(Boolean).join(" ↔ ") ||
    "Untitled comparison";
  return { id: e.id, label, badge: "comparison", createdAt: e.createdAt };
}

export default function PageComparisonClient() {
  const history = useHistory<PageComparisonEntry>(PAGE_COMPARISON_KEY);
  const { addEntry, removeEntry, findEntry, setActiveId } = history;

  const [leftMarkdown, setLeftMarkdown] = useState<string | null>(null);
  const [leftLabel, setLeftLabel] = useState("");
  const [rightMarkdown, setRightMarkdown] = useState<string | null>(null);
  const [rightLabel, setRightLabel] = useState("");

  const [viewMode, setViewMode] = useState<ViewMode>("rendered");

  const handleLeftConvert = useCallback(
    (markdown: string, autoLabel: string) => {
      const resolvedLabel = leftLabel || autoLabel;
      setLeftMarkdown(markdown);
      if (!leftLabel) {
        setLeftLabel(autoLabel);
      }

      /** A comparison is only worth saving once both sides have content. */
      if (rightMarkdown !== null) {
        addEntry({
          leftLabel: resolvedLabel,
          rightLabel: rightLabel || "Source B",
          leftMarkdown: markdown,
          rightMarkdown,
        });
      }
    },
    [leftLabel, rightMarkdown, rightLabel, addEntry],
  );

  const handleRightConvert = useCallback(
    (markdown: string, autoLabel: string) => {
      const resolvedLabel = rightLabel || autoLabel;
      setRightMarkdown(markdown);
      if (!rightLabel) {
        setRightLabel(autoLabel);
      }

      if (leftMarkdown !== null) {
        addEntry({
          leftLabel: leftLabel || "Source A",
          rightLabel: resolvedLabel,
          leftMarkdown,
          rightMarkdown: markdown,
        });
      }
    },
    [rightLabel, leftMarkdown, leftLabel, addEntry],
  );

  const showEntry = useCallback((entry: PageComparisonEntry | null) => {
    setLeftMarkdown(entry?.leftMarkdown ?? null);
    setLeftLabel(entry?.leftLabel ?? "");
    setRightMarkdown(entry?.rightMarkdown ?? null);
    setRightLabel(entry?.rightLabel ?? "");
  }, []);

  const handleSelect = useCallback(
    (entry: SidebarEntry) => {
      const full = findEntry(entry.id);
      if (!full) {
        return;
      }
      setActiveId(full.id);
      showEntry(full);
    },
    [findEntry, setActiveId, showEntry],
  );

  const handleRemove = useCallback(
    (id: string) => {
      removeEntry(id, showEntry);
    },
    [removeEntry, showEntry],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <ComparisonWorkspace
        entries={history.entries.map(toSidebarEntry)}
        activeId={history.activeId}
        emptyMessage="No comparisons yet. Convert both sources to save a comparison."
        onSelect={handleSelect}
        onRemove={handleRemove}
      >
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
      </ComparisonWorkspace>
    </div>
  );
}
