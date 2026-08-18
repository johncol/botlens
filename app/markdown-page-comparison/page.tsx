import PageComparisonClient from "./PageComparisonClient";
import { ToolPageShell } from "@/components/ToolPageShell";

export default function PageComparisonPage() {
  return (
    <ToolPageShell href="/markdown-page-comparison">
      <PageComparisonClient />
    </ToolPageShell>
  );
}
