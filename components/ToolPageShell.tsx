import { PageHeader } from "@/components/PageHeader";
import { getTool } from "@/lib/tools";

interface ToolPageShellProps {
  /** Route of the tool, used to look up its title and description. */
  href: string;
  children: React.ReactNode;
}

/** Page frame shared by every tool: header from the tool registry, then content. */
export function ToolPageShell({ href, children }: ToolPageShellProps) {
  const tool = getTool(href);
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <PageHeader title={tool.title} description={tool.description} />
      {children}
    </div>
  );
}
