"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { TOOLS } from "@/lib/tools";

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
        {TOOLS.map(({ href, title, icon: Icon }) => (
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
            {title}
          </Link>
        ))}
      </nav>
    </header>
  );
}
