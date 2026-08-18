/** HTML tags a crawler fetch may extract before the markdown conversion. */
export const TAG_FILTERS = [
  "body",
  "header",
  "nav",
  "main",
  "footer",
] as const;

export type TagFilter = (typeof TAG_FILTERS)[number];

export const DEFAULT_TAG_FILTER: TagFilter = "main";

export function isTagFilter(value: string): value is TagFilter {
  return (TAG_FILTERS as readonly string[]).includes(value);
}

/** Warning shown when a crawler fetch returns a tag with no readable text. */
export function emptyContentWarning(tag: string): string {
  return `Crawler received a page with no readable text in <${tag}> — the site likely requires JavaScript to render content. Raw bots see an empty shell.`;
}
