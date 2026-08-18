"use client";

import { HistorySidebar } from "@/components/HistorySidebar";
import type { SidebarEntry } from "@/types";

interface ComparisonWorkspaceProps {
  entries: SidebarEntry[];
  activeId: string | null;
  emptyMessage: string;
  onSelect: (entry: SidebarEntry) => void;
  onRemove: (id: string) => void;
  children: React.ReactNode;
}

/** History sidebar plus the main results area shared by every comparison tool. */
export function ComparisonWorkspace({
  entries,
  activeId,
  emptyMessage,
  onSelect,
  onRemove,
  children,
}: ComparisonWorkspaceProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <HistorySidebar
        entries={entries}
        activeId={activeId}
        emptyMessage={emptyMessage}
        onSelect={onSelect}
        onRemove={onRemove}
      />
      <main className="flex flex-col flex-1 overflow-hidden p-4 gap-3">
        {children}
      </main>
    </div>
  );
}
