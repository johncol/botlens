import { diffLines } from "diff";

export type DiffHunk = { value: string; added?: boolean; removed?: boolean };

export type ComparisonResult = {
  hunks: DiffHunk[];
  addedLines: number;
  removedLines: number;
  isIdentical: boolean;
};

export function compareMarkdowns(
  humanMarkdown: string,
  crawlerMarkdown: string,
): ComparisonResult {
  const hunks = diffLines(humanMarkdown, crawlerMarkdown);
  let addedLines = 0;
  let removedLines = 0;

  for (const hunk of hunks) {
    const lines = hunk.value.split("\n").filter((l) => l.length > 0).length;
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
