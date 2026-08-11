import PageComparisonClient from "./PageComparisonClient";
import { PageHeader } from "@/components/PageHeader";
import { TOOLS } from "@/lib/tools";

export default function PageComparisonPage() {
  const tool = TOOLS.find((t) => t.href === "/markdown-page-comparison")!;
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <PageHeader title={tool.title} description={tool.description} />
      <PageComparisonClient />
    </div>
  );
}
