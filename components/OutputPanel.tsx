"use client";

import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, X } from "lucide-react";
import { compareMarkdowns } from "@/lib/compare-markdowns";
import {
  useCopyLinkToast,
  CopyLinkToast,
  makeLinkComponents,
} from "@/components/MarkdownLinkCopy";
import type { ViewMode } from "@/components/ViewToggle";

export interface OutputPanelProps {
  title: string;
  icon: React.ReactNode;
  markdown: string | null;
  viewMode: ViewMode;
  warning?: string;
  error?: string;
  /** When viewMode === 'diff', diff the content against this base */
  diffBase?: string | null;
  diffMode?: "exact" | "smart";
}

export function OutputPanel({
  title,
  icon,
  markdown,
  viewMode,
  warning,
  error,
  diffBase,
  diffMode = "exact",
}: OutputPanelProps) {
  const [dismissedWarning, setDismissedWarning] = useState<string>();
  const [dismissedError, setDismissedError] = useState<string>();
  const { copiedUrl, triggerCopy } = useCopyLinkToast();
  const linkComponents = makeLinkComponents(triggerCopy);

  const diffResult = useMemo(() => {
    if (viewMode !== "diff" || diffBase == null || markdown == null)
      return null;
    return compareMarkdowns(diffBase, markdown, diffMode !== "smart");
  }, [viewMode, diffBase, markdown, diffMode]);

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0 border rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b bg-muted/40 shrink-0 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        <div className="ml-auto flex items-center gap-2">
          {diffResult && (
            <div className="flex items-center gap-1.5">
              {diffResult.removedLines > 0 && (
                <span className="text-xs font-mono font-medium text-red-600 dark:text-red-400">
                  −{diffResult.removedLines}
                </span>
              )}
              {diffResult.addedLines > 0 && (
                <span className="text-xs font-mono font-medium text-green-600 dark:text-green-400">
                  +{diffResult.addedLines}
                </span>
              )}
              {diffResult.isIdentical && (
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  identical
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      {warning && warning !== dismissedWarning && (
        <div className="flex items-start gap-1.5 px-4 py-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />
          <span className="flex-1">{warning}</span>
          <button
            type="button"
            aria-label="Dismiss warning"
            onClick={() => setDismissedWarning(warning)}
            className="shrink-0 ml-1 text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {error && error !== dismissedError && (
        <div className="flex items-start gap-1.5 px-4 py-2 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-800 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setDismissedError(error)}
            className="shrink-0 ml-1 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {markdown !== null ? (
          viewMode === "diff" && diffResult ? (
            <pre className="text-xs font-mono whitespace-pre-wrap break-words p-4 leading-5">
              {diffResult.hunks.map((chunk, i) => {
                const prefix = chunk.removed ? "-" : chunk.added ? "+" : " ";
                const cls = chunk.removed
                  ? "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300"
                  : chunk.added
                    ? "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300"
                    : "text-foreground";
                const lines = chunk.value.split("\n");
                if (lines[lines.length - 1] === "") lines.pop();
                return lines.map((line, j) => (
                  <span key={`${i}-${j}`} className={`block ${cls}`}>
                    {prefix} {line}
                  </span>
                ));
              })}
            </pre>
          ) : markdown.trim() ? (
            <div className="p-4">
              {viewMode === "rendered" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={linkComponents}>
                    {markdown}
                  </ReactMarkdown>
                  <CopyLinkToast url={copiedUrl} />
                </div>
              ) : (
                <pre className="text-xs font-mono whitespace-pre-wrap break-words text-foreground">
                  {markdown}
                </pre>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[120px] text-muted-foreground text-xs px-4 text-center">
              No readable text returned.
            </div>
          )
        ) : error ? (
          <div className="flex items-center justify-center h-full min-h-[120px] text-muted-foreground text-xs">
            Content unavailable.
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[120px] text-muted-foreground text-xs">
            Submit a URL above to see results.
          </div>
        )}
      </div>
    </div>
  );
}
