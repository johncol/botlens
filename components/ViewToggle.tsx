"use client";

import { cn } from "@/lib/utils";

export type ViewMode = "rendered" | "raw" | "diff";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  modes?: ViewMode[];
}

const MODE_LABELS: Record<ViewMode, string> = {
  rendered: "Rendered",
  raw: "Raw",
  diff: "Raw Diff",
};

export function ViewToggle({
  value,
  onChange,
  modes = ["rendered", "raw"],
}: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
      {modes.map((mode) => (
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
          {MODE_LABELS[mode]}
        </button>
      ))}
    </div>
  );
}
