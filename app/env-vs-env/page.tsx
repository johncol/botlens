import EnvVsEnvClient from "./EnvVsEnvClient";
import { getPageInitialValues } from "@/lib/page-prefill";
import { PageHeader } from "@/components/PageHeader";
import { TOOLS } from "@/lib/tools";
import { IS_VERCEL } from "@/lib/config";

export default function EnvVsEnvPage() {
  const tool = TOOLS.find((t) => t.href === "/env-vs-env")!;
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <PageHeader title={tool.title} description={tool.description} />
      <EnvVsEnvClient
        initialValues={getPageInitialValues(process.env)}
        isLocalAvailable={!IS_VERCEL}
      />
    </div>
  );
}
