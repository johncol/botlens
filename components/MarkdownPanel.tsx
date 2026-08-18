"use client";

import { MarkdownView } from "@/components/MarkdownView";
import type { ViewMode } from "@/components/ViewToggle";

interface MarkdownPanelProps {
  title: string;
  markdown: string;
  viewMode: ViewMode;
}

export function MarkdownPanel({
  title,
  markdown,
  viewMode,
}: MarkdownPanelProps) {
  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0 border rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b bg-muted/40 shrink-0">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <MarkdownView markdown={markdown} viewMode={viewMode} />
        </div>
      </div>
    </div>
  );
}
