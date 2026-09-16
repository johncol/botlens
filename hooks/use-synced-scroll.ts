import { useCallback, useRef, useState } from "react";
import type { PanelContent } from "@/types";
import { hasRenderableContent } from "@/lib/panels";
import type { ViewMode } from "@/components/ViewToggle";

/** Applies a scrollTop delta to a panel, clamped to its own scrollable range. */
export function applyClampedDelta(
  currentScrollTop: number,
  delta: number,
  maxScrollTop: number,
): number {
  const clampedMax = Math.max(maxScrollTop, 0);
  return Math.min(Math.max(currentScrollTop + delta, 0), clampedMax);
}

export interface SyncedScrollResult {
  syncScroll: boolean;
  setSyncScroll: (value: boolean) => void;
  /** Whether sync is currently possible (both panels have content, not in diff mode). */
  canSyncScroll: boolean;
  leftRef: React.RefObject<HTMLDivElement | null>;
  rightRef: React.RefObject<HTMLDivElement | null>;
  onLeftScroll: () => void;
  onRightScroll: () => void;
}

/**
 * Owns the "sync scroll" toggle state and links two comparison panels so
 * scrolling one moves the other by the same pixel delta, clamped at each
 * side's own bounds. A panel that hits its bound naturally resumes moving
 * once the other side's continued scrolling brings the applied delta back
 * within range. Sync only takes effect once both panels hold real content
 * and the view isn't in single-panel diff mode.
 */
export function useSyncedScroll(
  leftPanel: PanelContent,
  rightPanel: PanelContent,
  viewMode: ViewMode,
): SyncedScrollResult {
  const [syncScroll, setSyncScroll] = useState(false);
  const canSyncScroll =
    viewMode !== "diff" &&
    hasRenderableContent(leftPanel) &&
    hasRenderableContent(rightPanel);
  const enabled = syncScroll && canSyncScroll;

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const lastLeftTop = useRef(0);
  const lastRightTop = useRef(0);
  // Set right before a programmatic scrollTop write; consumed by that
  // panel's own scroll handler so it doesn't sync back and loop forever.
  const suppressLeft = useRef(false);
  const suppressRight = useRef(false);

  const onLeftScroll = useCallback(() => {
    const left = leftRef.current;
    if (!left) {
      return;
    }
    const newTop = left.scrollTop;
    if (suppressLeft.current) {
      suppressLeft.current = false;
      lastLeftTop.current = newTop;
      return;
    }
    const delta = newTop - lastLeftTop.current;
    lastLeftTop.current = newTop;

    const right = rightRef.current;
    if (enabled && right) {
      const maxTop = right.scrollHeight - right.clientHeight;
      suppressRight.current = true;
      right.scrollTop = applyClampedDelta(right.scrollTop, delta, maxTop);
      lastRightTop.current = right.scrollTop;
    }
  }, [enabled]);

  const onRightScroll = useCallback(() => {
    const right = rightRef.current;
    if (!right) {
      return;
    }
    const newTop = right.scrollTop;
    if (suppressRight.current) {
      suppressRight.current = false;
      lastRightTop.current = newTop;
      return;
    }
    const delta = newTop - lastRightTop.current;
    lastRightTop.current = newTop;

    const left = leftRef.current;
    if (enabled && left) {
      const maxTop = left.scrollHeight - left.clientHeight;
      suppressLeft.current = true;
      left.scrollTop = applyClampedDelta(left.scrollTop, delta, maxTop);
      lastLeftTop.current = left.scrollTop;
    }
  }, [enabled]);

  return {
    syncScroll,
    setSyncScroll,
    canSyncScroll,
    leftRef,
    rightRef,
    onLeftScroll,
    onRightScroll,
  };
}
