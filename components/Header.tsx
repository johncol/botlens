"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Hammer, FileText, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/ai-crawler-render-comparison",
    label: "AI Crawler Comparison",
    icon: Bot,
  },
  {
    href: "/markdown-page-comparison",
    label: "Page Comparison",
    icon: FileText,
  },
  {
    href: "/markdown-library-comparison",
    label: "Library Comparison",
    icon: Hammer,
  },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="shrink-0 border-b bg-background px-4 h-12 flex items-center gap-6">
      <Link
        href="/"
        className="text-sm font-semibold tracking-tight hover:text-primary transition-colors flex items-center gap-1.5"
      >
        <Home className="size-4" />
        BotLens
      </Link>
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1.5",
              pathname === href
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
