import Link from "next/link";
import { ArrowRight, Hammer, FileText, Bot, GitCompare } from "lucide-react";

const TOOLS = [
  {
    href: "/human-vs-bot",
    icon: Bot,
    title: "Human vs Bot",
    description:
      "Compare what a human sees (full JS-rendered page via Playwright) vs what an AI crawler sees (raw fetch with a bot user agent) for the same URL. Supports multiple environments and 10 AI crawler user agents.",
  },
  {
    href: "/env-comparison",
    icon: GitCompare,
    title: "Env Comparison",
    description:
      "Fetch the same page from two different environments (e.g. production vs development) using an AI crawler and compare the markdown output side by side. Useful for catching content or structure regressions before shipping.",
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

export default function Home() {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full px-6 py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">BotLens</h1>
          <p className="text-muted-foreground">
            Inspect how AI crawlers see your pages and compare HTML-to-markdown
            converters. Pick a tool below to get started.
          </p>
        </div>

        <div className="grid gap-4">
          {TOOLS.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-4 p-5 border rounded-xl hover:border-primary/50 hover:bg-accent/30 transition-colors"
            >
              <div className="mt-0.5 p-2 rounded-lg border bg-background group-hover:bg-primary/10 transition-colors">
                <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold">{title}</h2>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
