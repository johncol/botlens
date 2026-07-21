"use client";

import { SidebarEntry } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface HistorySidebarProps {
  entries: SidebarEntry[];
  activeId: string | null;
  emptyMessage?: string;
  onSelect: (entry: SidebarEntry) => void;
  onRemove: (id: string) => void;
}

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistorySidebar({
  entries,
  activeId,
  emptyMessage = "No history yet.",
  onSelect,
  onRemove,
}: HistorySidebarProps) {
  return (
    <aside className="w-64 shrink-0 border-r flex flex-col h-full bg-muted/30">
      <div className="px-4 py-3 border-b">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          History
        </h2>
      </div>

      {entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <p className="text-xs text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <ul className="py-2">
            {entries.map((entry, i) => (
              <li key={entry.id}>
                {i > 0 && <Separator className="mx-4 my-1" />}
                <div
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "group flex items-start gap-2 px-3 py-2 mx-1 rounded-md w-full text-left transition-colors cursor-pointer",
                    activeId === entry.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50",
                  )}
                  onClick={() => onSelect(entry)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(entry);
                    }
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate leading-tight">
                      {entry.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatTimestamp(entry.createdAt)}
                    </p>
                    <Badge
                      variant="outline"
                      className="mt-1 text-[10px] px-1 py-0 h-4"
                    >
                      {entry.badge}
                    </Badge>
                  </div>
                  <Button
                    aria-label={`Remove ${entry.label}`}
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(entry.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
