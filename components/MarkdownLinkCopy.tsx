"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ComponentProps } from "react";
import { Check } from "lucide-react";

const MAX_URL_LENGTH = 50;
const TOAST_DURATION_MS = 2000;

export function useCopyLinkToast() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerCopy = useCallback((href: string) => {
    // Resolve relative URLs against the current page
    let url = href;
    try {
      url = new URL(href, window.location.href).href;
    } catch {
      /* keep as-is */
    }

    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedUrl(url);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopiedUrl(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { copiedUrl, triggerCopy };
}

export function CopyLinkToast({ url }: { url: string | null }) {
  if (!url) return null;
  const display =
    url.length > MAX_URL_LENGTH ? url.slice(0, MAX_URL_LENGTH) + "…" : url;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground text-background text-xs shadow-lg max-w-xs">
      <Check className="w-3.5 h-3.5 shrink-0 text-green-400" />
      <span>
        Copied:{" "}
        <span className="font-mono break-all">{display}</span>
      </span>
    </div>
  );
}

export function makeLinkComponents(onLinkClick: (href: string) => void) {
  return {
    a({ href, children }: ComponentProps<"a">) {
      return (
        <a
          href={href}
          onClick={(e) => {
            e.preventDefault();
            if (href) onLinkClick(href);
          }}
          className="cursor-pointer"
        >
          {children}
        </a>
      );
    },
  };
}
