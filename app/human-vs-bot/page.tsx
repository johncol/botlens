import HumanVsBotClient from "./HumanVsBotClient";
import { getPageInitialValues } from "@/lib/page-prefill";
import { PageHeader } from "@/components/PageHeader";
import { TOOLS } from "@/lib/tools";

export default function HumanVsBotPage() {
  const tool = TOOLS.find((t) => t.href === "/human-vs-bot")!;
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <PageHeader title={tool.title} description={tool.description} />
      <HumanVsBotClient initialValues={getPageInitialValues(process.env)} />
    </div>
  );
}