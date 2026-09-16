import type { PanelContent } from "@/types";

export const EMPTY_PANEL: PanelContent = { markdown: null };

/** True once a panel holds either content or a failure worth showing. */
export function hasPanelContent(panel: PanelContent): boolean {
  return panel.markdown !== null || Boolean(panel.error);
}

/** True when a panel has real markdown text to scroll through (not empty/error placeholders). */
export function hasRenderableContent(panel: PanelContent): boolean {
  return panel.markdown !== null && panel.markdown.trim().length > 0;
}
