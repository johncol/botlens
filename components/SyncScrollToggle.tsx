"use client";

import { Link2, Unlink2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SyncScrollToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

/** Button that links/unlinks scrolling between the two side-by-side panels. */
export function SyncScrollToggle({ value, onChange }: SyncScrollToggleProps) {
  const Icon = value ? Link2 : Unlink2;

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <button
        type="button"
        aria-pressed={value}
        onClick={() => onChange(!value)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors",
          value
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        Sync scroll
      </button>
    </div>
  );
}
