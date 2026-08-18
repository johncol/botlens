import type { PanelContent } from "@/types";

export const EMPTY_PANEL: PanelContent = { markdown: null };

/** True once a panel holds either content or a failure worth showing. */
export function hasPanelContent(panel: PanelContent): boolean {
  return panel.markdown !== null || Boolean(panel.error);
}
