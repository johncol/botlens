import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TOOLS } from "@/lib/tools";

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
