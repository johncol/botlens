import { Hammer, FileText, Bot, GitCompare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Tool = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

export const TOOLS: Tool[] = [
  {
    href: "/human-vs-bot",
    icon: Bot,
    title: "Human vs Bot",
    description:
      "Compare what a human sees (full JS-rendered page via Playwright) vs what an AI crawler sees (raw fetch with a bot user agent) for the same URL. Supports multiple environments and 10 AI crawler user agents.",
  },
  {
    href: "/env-vs-env",
    icon: GitCompare,
    title: "Env vs Env",
    description:
      "Fetch the same page from two different environments (e.g. production vs development) using an AI crawler and compare the markdown output side by side.",
  },
  {
    href: "/markdown-page-comparison",
    icon: FileText,
    title: "Page Comparison",
    description:
      "Convert two different HTML sources with node-html-markdown and compare the results side by side. Useful for diffing a before/after, two versions of a page, or two different sites.",
  },
  {
    href: "/markdown-library-comparison",
    icon: Hammer,
    title: "Library Comparison",
    description:
      "Paste a URL or HTML snippet and see the output side by side from two converters: Turndown and node-html-markdown. Useful for evaluating which library produces cleaner markdown for a given source.",
  },
];

/** Looks up a tool by route. Throws when the route is not registered. */
export function getTool(href: string): Tool {
  const tool = TOOLS.find((candidate) => candidate.href === href);
  if (!tool) {
    throw new Error(`No tool registered for route ${href}`);
  }
  return tool;
}
