import LibraryComparisonClient from "./LibraryComparisonClient";
import { ToolPageShell } from "@/components/ToolPageShell";

export default function LibraryComparisonPage() {
  return (
    <ToolPageShell href="/markdown-library-comparison">
      <LibraryComparisonClient />
    </ToolPageShell>
  );
}
