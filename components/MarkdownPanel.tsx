"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  useCopyLinkToast,
  CopyLinkToast,
  makeLinkComponents,
} from "@/components/MarkdownLinkCopy";

interface MarkdownPanelProps {
  title: string;
  markdown: string;
  viewMode: import("@/components/ViewToggle").ViewMode;
}

export function MarkdownPanel({
  title,
  markdown,
  viewMode,
}: MarkdownPanelProps) {
  const { copiedUrl, triggerCopy } = useCopyLinkToast();
  const linkComponents = makeLinkComponents(triggerCopy);

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0 border rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b bg-muted/40 shrink-0">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto">
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
      </div>
    </div>
  );
}
