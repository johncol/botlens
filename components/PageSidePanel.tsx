"use client";

import { useState } from "react";
import { InlineAlert } from "@/components/InlineAlert";
import { LoadingButton } from "@/components/LoadingButton";
import { MarkdownView } from "@/components/MarkdownView";
import { Textarea } from "@/components/ui/textarea";
import { Link as LinkIcon, FileCode, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIZE_WARNING_BYTES } from "@/lib/constants";
import { useJsonRequest } from "@/hooks/use-json-request";
import type { ViewMode } from "@/components/ViewToggle";

interface PageSidePanelProps {
  placeholder: string;
  label: string;
  onLabelChange: (label: string) => void;
  markdown: string | null;
  onConvertSuccess: (markdown: string, autoLabel: string) => void;
  viewMode: ViewMode;
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
  const [editingLabel, setEditingLabel] = useState(false);
  const { isLoading, error, send } = useJsonRequest<{
    nodeHtmlMarkdown: string;
  }>("/api/convert", "Conversion failed");

  const htmlBytes = new TextEncoder().encode(htmlValue).length;
  const showSizeWarning =
    inputMode === "html" && htmlBytes > SIZE_WARNING_BYTES;

  async function handleConvert(event: React.FormEvent) {
    event.preventDefault();

    const payload =
      inputMode === "url"
        ? { url: urlValue.trim() }
        : { html: htmlValue.trim() };

    const data = await send(payload);
    if (!data) {
      return;
    }

    onConvertSuccess(data.nodeHtmlMarkdown, buildAutoLabel());
  }

  function buildAutoLabel(): string {
    if (inputMode !== "url") {
      return `Snippet — ${new Date().toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
    }
    try {
      return new URL(urlValue.trim()).hostname;
    } catch {
      return urlValue.trim();
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
          <LoadingButton
            type="submit"
            size="sm"
            isLoading={isLoading}
            className="h-8 shrink-0 text-xs"
          >
            Convert
          </LoadingButton>
        </form>

        {showSizeWarning && (
          <InlineAlert tone="warning" className="text-[11px]">
            Large input ({(htmlBytes / 1024).toFixed(0)} KB) — may be slow.
          </InlineAlert>
        )}
        {error && (
          <InlineAlert tone="error" className="text-[11px]">
            {error}
          </InlineAlert>
        )}
      </div>

      {/* Output section */}
      <div className="flex-1 overflow-y-auto">
        {markdown !== null ? (
          <div className="p-4">
            <MarkdownView markdown={markdown} viewMode={viewMode} />
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
