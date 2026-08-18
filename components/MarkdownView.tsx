"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  useCopyLinkToast,
  CopyLinkToast,
  makeLinkComponents,
} from "@/components/MarkdownLinkCopy";
import type { ViewMode } from "@/components/ViewToggle";

interface MarkdownViewProps {
  markdown: string;
  viewMode: ViewMode;
}

/**
 * Renders markdown either as formatted HTML or as raw text. Links copy their
 * resolved URL instead of navigating away from the tool.
 */
export function MarkdownView({ markdown, viewMode }: MarkdownViewProps) {
  const { copiedUrl, triggerCopy } = useCopyLinkToast();

  if (viewMode !== "rendered") {
    return (
      <pre className="text-xs font-mono whitespace-pre-wrap break-words text-foreground">
        {markdown}
      </pre>
    );
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={makeLinkComponents(triggerCopy)}
      >
        {markdown}
      </ReactMarkdown>
      <CopyLinkToast url={copiedUrl} />
    </div>
  );
}
