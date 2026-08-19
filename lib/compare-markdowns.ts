import { diffArrays } from "diff";

export type DiffHunk = { value: string; added?: boolean; removed?: boolean };

export type ComparisonResult = {
  hunks: DiffHunk[];
  addedLines: number;
  removedLines: number;
  isIdentical: boolean;
};

type EquivalencyRule = (humanLine: string, crawlerLine: string) => boolean;

/**
 * Permitted equivalencies used in non-strict mode.
 * Each rule receives trimmed lines (no trailing newline/whitespace).
 */
const NON_STRICT_RULES: EquivalencyRule[] = [
  // A human video link [Video](url) is equivalent to a crawler poster link [VideoPoster](url).
  // This occurs when a <video> element renders in a browser but falls back to its poster
  // image for raw HTTP crawlers.
  (human, crawler) =>
    /^\[Video\]\(.+\)$/.test(human) && /^\[VideoPoster\]\(.+\)$/.test(crawler),

  // Two lines are equivalent when their only URL difference is a ".qa" environment subdomain,
  // e.g. assets.aritzia.com vs assets.qa.aritzia.com.
  (human, crawler) => human.replace(/\.qa\./g, ".") === crawler.replace(/\.qa\./g, "."),
];

function makeComparator(rules: EquivalencyRule[]) {
  return (a: string, b: string): boolean => {
    if (a === b) return true;
    return rules.some((rule) => rule(a.trimEnd(), b.trimEnd()));
  };
}

/** Split a markdown string into line tokens (each retaining its trailing newline). */
function splitLines(md: string): string[] {
  const lines: string[] = [];
  let rest = md;
  while (rest.length > 0) {
    const nl = rest.indexOf("\n");
    if (nl === -1) {
      lines.push(rest);
      break;
    }
    lines.push(rest.slice(0, nl + 1));
    rest = rest.slice(nl + 1);
  }
  return lines;
}

/**
 * Compare two markdown strings line by line.
 *
 * @param strict - When `true` (default) every line must match exactly.
 *                 When `false` the permitted-equivalents rules are applied,
 *                 e.g. `[Video](url)` ≡ `[VideoPoster](url)`.
 */
export function compareMarkdowns(
  humanMarkdown: string,
  crawlerMarkdown: string,
  strict = true,
): ComparisonResult {
  const humanLines = splitLines(humanMarkdown);
  const crawlerLines = splitLines(crawlerMarkdown);

  const rawHunks = diffArrays(humanLines, crawlerLines, {
    ...(strict ? {} : { comparator: makeComparator(NON_STRICT_RULES) }),
  });

  const hunks: DiffHunk[] = rawHunks.map((h) => ({
    value: h.value.join(""),
    added: h.added,
    removed: h.removed,
  }));

  let addedLines = 0;
  let removedLines = 0;

  for (const hunk of hunks) {
    const lines = hunk.value.split("\n").filter((l: string) => l.length > 0).length;
    if (hunk.added) addedLines += lines;
    if (hunk.removed) removedLines += lines;
  }

  return {
    hunks,
    addedLines,
    removedLines,
    isIdentical: addedLines === 0 && removedLines === 0,
  };
}
