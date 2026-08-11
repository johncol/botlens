import LibraryComparisonClient from "./LibraryComparisonClient";
import { PageHeader } from "@/components/PageHeader";
import { TOOLS } from "@/lib/tools";

export default function LibraryComparisonPage() {
  const tool = TOOLS.find((t) => t.href === "/markdown-library-comparison")!;
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <PageHeader title={tool.title} description={tool.description} />
      <LibraryComparisonClient />
    </div>
  );
}
