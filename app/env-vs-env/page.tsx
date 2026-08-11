import EnvVsEnvClient from "./EnvVsEnvClient";
import { getPageInitialValues } from "@/lib/page-prefill";

export default function EnvVsEnvPage() {
  return (
    <EnvVsEnvClient
      initialValues={getPageInitialValues(process.env)}
    />
  );
}
