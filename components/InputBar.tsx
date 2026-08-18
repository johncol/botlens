"use client";

import { useState, useRef } from "react";
import { InlineAlert } from "@/components/InlineAlert";
import { LoadingButton } from "@/components/LoadingButton";
import { Textarea } from "@/components/ui/textarea";
import { FIELD_INPUT_CLASS } from "@/components/form/field-styles";
import { Link, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIZE_WARNING_BYTES } from "@/lib/constants";

interface InputBarProps {
  onConvert: (params: {
    url?: string;
    html?: string;
    label: string;
    type: "url" | "snippet";
  }) => void;
  isLoading: boolean;
  error: string | null;
}

export function InputBar({ onConvert, isLoading, error }: InputBarProps) {
  const [mode, setMode] = useState<"url" | "html">("url");
  const [urlValue, setUrlValue] = useState("");
  const [htmlValue, setHtmlValue] = useState("");
  const urlInputRef = useRef<HTMLInputElement>(null);

  const htmlBytes = new TextEncoder().encode(htmlValue).length;
  const showSizeWarning = mode === "html" && htmlBytes > SIZE_WARNING_BYTES;

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    if (mode === "url") {
      const trimmed = urlValue.trim();
      if (!trimmed) return;
      onConvert({ url: trimmed, label: trimmed, type: "url" });
    } else {
      const trimmed = htmlValue.trim();
      if (!trimmed) return;
      const label = `Snippet — ${new Date().toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`;
      onConvert({ html: trimmed, label, type: "snippet" });
    }
  }

  return (
    <div className="border-b px-4 py-3 space-y-2 bg-background">
      {/* Mode tabs */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-colors",
            mode === "url"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          <Link className="w-3 h-3" />
          URL
        </button>
        <button
          type="button"
          onClick={() => setMode("html")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 text-xs rounded-md font-medium transition-colors",
            mode === "html"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          <FileCode className="w-3 h-3" />
          HTML
        </button>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-start">
        {mode === "url" ? (
          <input
            ref={urlInputRef}
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://example.com"
            required
            className={cn(FIELD_INPUT_CLASS, "flex-1 ring-offset-background")}
          />
        ) : (
          <Textarea
            value={htmlValue}
            onChange={(e) => setHtmlValue(e.target.value)}
            placeholder="Paste HTML here…"
            required
            className="flex-1 min-h-[80px] max-h-[200px] text-sm font-mono resize-y"
          />
        )}
        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingLabel="Converting…"
          className="h-9 shrink-0"
        >
          Convert
        </LoadingButton>
      </form>

      {/* Warnings / errors */}
      {showSizeWarning && (
        <InlineAlert tone="warning">
          Large input ({(htmlBytes / 1024).toFixed(0)} KB) — conversion may be
          slow.
        </InlineAlert>
      )}
      {error && <InlineAlert tone="error">{error}</InlineAlert>}
    </div>
  );
}
