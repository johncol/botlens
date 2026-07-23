import HumanVsBotClient from "./HumanVsBotClient";
import { getCrawlerComparisonInitialValues } from "@/lib/crawler-prefill";

export default function HumanVsBotPage() {
  return (
    <HumanVsBotClient
      initialValues={getCrawlerComparisonInitialValues(process.env)}
    />
  );
}