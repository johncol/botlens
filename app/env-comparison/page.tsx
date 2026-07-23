import EnvComparisonClient from "./EnvComparisonClient";
import { getPageInitialValues } from "@/lib/page-prefill";

export default function EnvComparisonPage() {
  return (
    <EnvComparisonClient
      initialValues={getPageInitialValues(process.env)}
    />
  );
}
