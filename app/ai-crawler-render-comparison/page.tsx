import AiCrawlerRenderComparisonClient from "./AiCrawlerRenderComparisonClient";
import { getCrawlerComparisonInitialValues } from "@/lib/crawler-prefill";

export default function AiCrawlerRenderComparisonPage() {
  return (
    <AiCrawlerRenderComparisonClient
      initialValues={getCrawlerComparisonInitialValues(process.env)}
    />
  );
}