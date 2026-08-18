interface EmptyStateProps {
  message: string;
  hint?: React.ReactNode;
}

/** Centred placeholder shown before a tool has any results to display. */
export function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center text-center">
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">{message}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}
