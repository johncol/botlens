"use client";

import { cn } from "@/lib/utils";

export type DiffMode = "exact" | "smart";

const DIFF_MODES: DiffMode[] = ["exact", "smart"];

const DIFF_MODE_LABELS: Record<DiffMode, string> = {
  exact: "Exact",
  smart: "Smart",
};

interface DiffModeToggleProps {
  value: DiffMode;
  onChange: (mode: DiffMode) => void;
}

export function DiffModeToggle({ value, onChange }: DiffModeToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {DIFF_MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-md transition-colors",
            value === mode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {DIFF_MODE_LABELS[mode]}
        </button>
      ))}
    </div>
  );
}
