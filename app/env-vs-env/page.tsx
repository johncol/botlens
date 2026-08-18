import EnvVsEnvClient from "./EnvVsEnvClient";
import { getPageInitialValues } from "@/lib/page-prefill";
import { ToolPageShell } from "@/components/ToolPageShell";
import { IS_VERCEL } from "@/lib/config";

export default function EnvVsEnvPage() {
  return (
    <ToolPageShell href="/env-vs-env">
      <EnvVsEnvClient
        initialValues={getPageInitialValues(process.env)}
        isLocalAvailable={!IS_VERCEL}
      />
    </ToolPageShell>
  );
}
