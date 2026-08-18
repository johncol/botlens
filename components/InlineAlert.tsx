import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineAlertProps {
  tone: "error" | "warning";
  className?: string;
  children: React.ReactNode;
}

/** Single-line warning or error message with a leading icon. */
export function InlineAlert({ tone, className, children }: InlineAlertProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-1.5 text-xs",
        tone === "warning"
          ? "text-amber-600 dark:text-amber-400"
          : "text-destructive",
        className,
      )}
    >
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      {children}
    </p>
  );
}
