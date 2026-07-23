import { AI_CRAWLERS } from "@/lib/crawlers";

interface CrawlerSelectProps {
  value: string;
  onChange: (crawlerId: string) => void;
}

export function CrawlerSelect({ value, onChange }: CrawlerSelectProps) {
  return (
    <div className="flex flex-col gap-1 min-w-[200px]">
      <label className="text-xs text-muted-foreground font-medium">
        AI Crawler
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-2 pr-7 text-sm rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {AI_CRAWLERS.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
