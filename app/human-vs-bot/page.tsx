import HumanVsBotClient from "./HumanVsBotClient";
import { getPageInitialValues } from "@/lib/page-prefill";
import { ToolPageShell } from "@/components/ToolPageShell";
import { IS_VERCEL } from "@/lib/config";

export default function HumanVsBotPage() {
  return (
    <ToolPageShell href="/human-vs-bot">
      <HumanVsBotClient
        initialValues={getPageInitialValues(process.env)}
        isLocalAvailable={!IS_VERCEL}
      />
    </ToolPageShell>
  );
}