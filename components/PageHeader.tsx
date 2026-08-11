interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="shrink-0 border-b px-4 py-3 bg-background space-y-0.5">
      <h1 className="text-sm font-semibold">{title}</h1>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
