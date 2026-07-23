"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  useCopyLinkToast,
  CopyLinkToast,
  makeLinkComponents,
} from "@/components/MarkdownLinkCopy";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Loader2,
  Link as LinkIcon,
  FileCode,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SIZE_WARNING_BYTES } from "@/lib/constants";

interface PageSidePanelProps {
  placeholder: string;
  label: string;
  onLabelChange: (label: string) => void;
  markdown: string | null;
  onConvertSuccess: (markdown: string, autoLabel: string) => void;
  viewMode: import("@/components/ViewToggle").ViewMode;
}

export function PageSidePanel({
  placeholder,
  label,
  onLabelChange,
  markdown,
  onConvertSuccess,
  viewMode,
}: PageSidePanelProps) {
  const [inputMode, setInputMode] = useState<"url" | "html">("url");
  const [urlValue, setUrlValue] = useState("");
  const [htmlValue, setHtmlValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState(false);
  const { copiedUrl, triggerCopy } = useCopyLinkToast();
  const linkComponents = makeLinkComponents(triggerCopy);

  const htmlBytes = new TextEncoder().encode(htmlValue).length;
  const showSizeWarning =
    inputMode === "html" && htmlBytes > SIZE_WARNING_BYTES;

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const body =
        inputMode === "url"
          ? { url: urlValue.trim() }
          : { html: htmlValue.trim() };

      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Conversion failed");
        return;
      }

      let autoLabel: string;
      if (inputMode === "url") {
        try {
          autoLabel = new URL(urlValue.trim()).hostname;
        } catch {
          autoLabel = urlValue.trim();
        }
      } else {
        autoLabel = `Snippet — ${new Date().toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
      }

      onConvertSuccess(data.nodeHtmlMarkdown as string, autoLabel);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0 border rounded-lg overflow-hidden">
      {/* Input section */}
      <div className="shrink-0 border-b bg-muted/20 p-3 space-y-2">
        {/* Editable label */}
        <div className="flex items-center gap-1 group">
          {editingLabel ? (
            <input
              autoFocus
              type="text"
              value={label}
              onChange={(e) => onLabelChange(e.target.value)}
              onBlur={() => setEditingLabel(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingLabel(false)}
              placeholder={placeholder}
              className="flex-1 text-xs font-semibold bg-transparent border-b border-primary outline-none py-0.5"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingLabel(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-left hover:text-primary transition-colors group"
            >
              <span className={cn(!label && "text-muted-foreground")}>
                {label || placeholder}
              </span>
              <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
            </button>
          )}
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1">
          {(["url", "html"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setInputMode(mode)}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors",
                inputMode === mode
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {mode === "url" ? (
                <LinkIcon className="w-3 h-3" />
              ) : (
                <FileCode className="w-3 h-3" />
              )}
              {mode.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Input + convert button */}
        <form onSubmit={handleConvert} className="flex gap-2 items-start">
          {inputMode === "url" ? (
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://example.com"
              required
              className="flex-1 h-8 px-2.5 text-xs rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          ) : (
            <Textarea
              value={htmlValue}
              onChange={(e) => setHtmlValue(e.target.value)}
              placeholder="Paste HTML here…"
              required
              className="flex-1 min-h-[60px] max-h-[160px] text-xs font-mono resize-y"
            />
          )}
          <Button
            type="submit"
            size="sm"
            disabled={isLoading}
            className="h-8 shrink-0 text-xs"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              "Convert"
            )}
          </Button>
        </form>

        {showSizeWarning && (
          <p className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            Large input ({(htmlBytes / 1024).toFixed(0)} KB) — may be slow.
          </p>
        )}
        {error && (
          <p className="flex items-center gap-1 text-[11px] text-destructive">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            {error}
          </p>
        )}
      </div>

      {/* Output section */}
      <div className="flex-1 overflow-y-auto">
        {markdown !== null ? (
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
          <div className="flex items-center justify-center h-full min-h-[120px] text-muted-foreground text-xs">
            Enter a URL or HTML above and click Convert.
          </div>
        )}
      </div>
    </div>
  );
}
