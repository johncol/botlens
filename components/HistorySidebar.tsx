"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SidebarEntry } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_WIDTH = 256; // matches the original w-64
const COLLAPSED_WIDTH = 28;
const MAX_WIDTH_FRACTION = 0.5;
const STORAGE_KEY = "botlens-sidebar";

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
  const [width, setWidth] = useState(MIN_WIDTH);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Load preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.width === "number")
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setWidth(Math.max(MIN_WIDTH, parsed.width));
        if (typeof parsed.collapsed === "boolean")
          setIsCollapsed(parsed.collapsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist preference to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ width, collapsed: isCollapsed }),
      );
    } catch {
      /* ignore */
    }
  }, [width, isCollapsed]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isCollapsed) return;
      dragging.current = true;
      startX.current = e.clientX;
      startWidth.current = width;
      e.preventDefault();

      function onMouseMove(ev: MouseEvent) {
        if (!dragging.current) return;
        const maxWidth = window.innerWidth * MAX_WIDTH_FRACTION;
        const delta = ev.clientX - startX.current;
        setWidth(
          Math.round(
            Math.min(maxWidth, Math.max(MIN_WIDTH, startWidth.current + delta)),
          ),
        );
      }

      function onMouseUp() {
        dragging.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [isCollapsed, width],
  );

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <div
      className="shrink-0 h-full flex"
      style={{ width: isCollapsed ? COLLAPSED_WIDTH : width }}
    >
      {/* Sidebar content — hidden when collapsed */}
      {!isCollapsed && (
        <div className="flex flex-col flex-1 min-w-0 h-full bg-muted/30 overflow-hidden">
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
        </div>
      )}

      {/* Drag handle / collapse strip */}
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn(
          "group flex items-center justify-center border-r bg-muted/30",
          isCollapsed
            ? "flex-1 cursor-default"
            : "w-2 cursor-col-resize hover:bg-primary/10 transition-colors",
        )}
        onMouseDown={handleMouseDown}
      >
        <button
          type="button"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse();
          }}
          className="flex items-center justify-center w-5 h-8 rounded text-muted-foreground hover:text-foreground hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </div>
    </div>
  );
}
