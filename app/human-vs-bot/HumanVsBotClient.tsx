"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CrawlerComparisonEntry, PanelContent, SidebarEntry } from "@/types";
import { CRAWLER_COMPARISON_KEY } from "@/lib/history";
import {
  ENVIRONMENTS,
  getHostname,
  buildUrl,
  isValidPort,
  parseDomainInput,
  toPathWithQuery,
  getAvailableEnvironments,
  LOCAL_HOSTNAME,
  MAX_PORT,
  MIN_PORT,
  type Environment,
} from "@/lib/environments";
import { EMPTY_PANEL, hasPanelContent } from "@/lib/panels";
import { cn } from "@/lib/utils";
import { AI_CRAWLERS, DEFAULT_CRAWLER_ID } from "@/lib/crawlers";
import type { PageInitialValues } from "@/lib/page-prefill";
import { useHistory } from "@/hooks/use-history";
import { useJsonRequest } from "@/hooks/use-json-request";
import {
  hasCompleteCredentials,
  useEnvironmentCredentials,
} from "@/hooks/use-environment-credentials";
import { ComparisonWorkspace } from "@/components/ComparisonWorkspace";
import { DiffModeToggle, type DiffMode } from "@/components/DiffModeToggle";
import { EmptyState } from "@/components/EmptyState";
import { InlineAlert } from "@/components/InlineAlert";
import { LoadingButton } from "@/components/LoadingButton";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { EnvironmentSelect } from "@/components/EnvironmentSelect";
import { CrawlerSelect } from "@/components/CrawlerSelect";
import { OutputPanel } from "@/components/OutputPanel";
import { CredentialFields } from "@/components/form/CredentialFields";
import { DomainField } from "@/components/form/DomainField";
import { PageField } from "@/components/form/PageField";
import { PortField } from "@/components/form/PortField";
import { Badge } from "@/components/ui/badge";
import { Bot, User } from "lucide-react";

type ComparisonResponse = {
  humanMarkdown: string | null;
  crawlerMarkdown: string | null;
  humanWarning?: string;
  crawlerWarning?: string;
  humanError?: string;
  crawlerError?: string;
  resolvedUrl?: string;
};

function toSidebarEntry(entry: CrawlerComparisonEntry): SidebarEntry {
  let label = entry.url;
  try {
    label = `${new URL(entry.url).pathname} (${entry.environment})`;
  } catch {
    /* a malformed stored URL still shows as-is */
  }
  return {
    id: entry.id,
    label,
    badge: entry.crawlerLabel,
    createdAt: entry.createdAt,
  };
}

function toPanels(entry: CrawlerComparisonEntry | null) {
  return {
    human: {
      markdown: entry?.humanMarkdown ?? null,
      warning: entry?.humanWarning,
      error: entry?.humanError,
    },
    crawler: {
      markdown: entry?.crawlerMarkdown ?? null,
      warning: entry?.crawlerWarning,
      error: entry?.crawlerError,
    },
  };
}

interface HumanVsBotClientProps {
  initialValues: PageInitialValues;
  isLocalAvailable: boolean;
}

export default function HumanVsBotClient({
  initialValues,
  isLocalAvailable,
}: HumanVsBotClientProps) {
  const history = useHistory<CrawlerComparisonEntry>(CRAWLER_COMPARISON_KEY);
  const { addEntry, removeEntry, findEntry, setActiveId } = history;

  const [domainInput, setDomainInput] = useState(initialValues.domain);
  const [lockedDomain, setLockedDomain] = useState<string | null>(() =>
    initialValues.domain.trim()
      ? parseDomainInput(initialValues.domain).prodDomain
      : null,
  );
  const [pageInput, setPageInput] = useState(initialValues.page);
  const [environment, setEnvironment] = useState<Environment>(() =>
    initialValues.domain.trim()
      ? parseDomainInput(initialValues.domain).env
      : "production",
  );
  const [crawlerId, setCrawlerId] = useState(DEFAULT_CRAWLER_ID);
  const [localPort, setLocalPort] = useState(initialValues.localPort);

  const availableEnvironments = getAvailableEnvironments(isLocalAvailable);
  const pageInputRef = useRef<HTMLInputElement>(null);

  const [panels, setPanels] = useState<{
    human: PanelContent;
    crawler: PanelContent;
  }>({ human: EMPTY_PANEL, crawler: EMPTY_PANEL });
  const [viewMode, setViewMode] = useState<ViewMode>("rendered");
  const [diffMode, setDiffMode] = useState<DiffMode>("exact");

  const { isLoading, error, setError, send } =
    useJsonRequest<ComparisonResponse>("/api/human-vs-bot", "Comparison failed");

  const { getCredentials, updateCredential } = useEnvironmentCredentials(
    initialValues.credentials,
  );

  // Focus the page input whenever the domain becomes locked
  useEffect(() => {
    if (lockedDomain !== null) {
      pageInputRef.current?.focus();
    }
  }, [lockedDomain]);

  function handleDomainCommit() {
    if (!domainInput.trim()) {
      return;
    }
    const { prodDomain, env } = parseDomainInput(domainInput);
    setLockedDomain(prodDomain);
    setEnvironment(env);
  }

  function handleDomainClear() {
    setLockedDomain(null);
    setDomainInput("");
    setEnvironment("production");
  }

  const requiresAuth = ENVIRONMENTS[environment].requiresAuth;
  const requiresPort = ENVIRONMENTS[environment].kind === "localhost";
  const currentCredentials = getCredentials(environment);
  const canSubmit =
    !isLoading &&
    lockedDomain !== null &&
    pageInput.trim().length > 0 &&
    (!requiresPort || isValidPort(localPort.trim())) &&
    (!requiresAuth || hasCompleteCredentials(currentCredentials));

  const selectedCrawler =
    AI_CRAWLERS.find((crawler) => crawler.id === crawlerId) ?? AI_CRAWLERS[0];

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!lockedDomain || !pageInput.trim()) {
        return;
      }

      const trimmedPort = localPort.trim();
      if (
        ENVIRONMENTS[environment].kind === "localhost" &&
        !isValidPort(trimmedPort)
      ) {
        setError(`Enter a port between ${MIN_PORT} and ${MAX_PORT}`);
        return;
      }

      const path = toPathWithQuery(pageInput.trim());
      setPageInput(path);

      const fullUrl = buildUrl(lockedDomain, path, environment, {
        localPort: trimmedPort,
      });
      const credentials = getCredentials(environment);

      const data = await send({
        url: fullUrl,
        environment,
        crawlerUserAgent: selectedCrawler.userAgent,
        ...(ENVIRONMENTS[environment].requiresAuth && {
          username: credentials.username,
          password: credentials.password,
        }),
      });
      if (!data) {
        return;
      }

      setPanels({
        human: {
          markdown: data.humanMarkdown,
          warning: data.humanWarning,
          error: data.humanError,
        },
        crawler: {
          markdown: data.crawlerMarkdown,
          warning: data.crawlerWarning,
          error: data.crawlerError,
        },
      });

      addEntry({
        url: data.resolvedUrl ?? fullUrl,
        environment: ENVIRONMENTS[environment].label,
        crawlerLabel: selectedCrawler.label,
        humanMarkdown: data.humanMarkdown,
        crawlerMarkdown: data.crawlerMarkdown,
        humanWarning: data.humanWarning,
        crawlerWarning: data.crawlerWarning,
        humanError: data.humanError,
        crawlerError: data.crawlerError,
      });
    },
    [
      lockedDomain,
      pageInput,
      environment,
      localPort,
      selectedCrawler,
      getCredentials,
      send,
      setError,
      addEntry,
    ],
  );

  const handleSelect = useCallback(
    (entry: SidebarEntry) => {
      const full = findEntry(entry.id);
      if (!full) {
        return;
      }
      setActiveId(full.id);
      setPanels(toPanels(full));

      // Restore domain + page from the stored URL
      try {
        const parsed = new URL(full.url);
        // A localhost URL carries no production domain, so the locked one stays.
        if (parsed.hostname.toLowerCase() === LOCAL_HOSTNAME) {
          setEnvironment("local");
          setLocalPort(parsed.port);
        } else {
          const { prodDomain, env } = parseDomainInput(parsed.hostname);
          setLockedDomain(prodDomain);
          setEnvironment(env);
        }
        setPageInput(`${parsed.pathname}${parsed.search}${parsed.hash}`);
      } catch {
        setPageInput(full.url);
      }
      setError(null);
    },
    [findEntry, setActiveId, setError],
  );

  const handleRemove = useCallback(
    (id: string) => {
      removeEntry(id, (next) => setPanels(toPanels(next)));
    },
    [removeEntry],
  );

  const showResults =
    hasPanelContent(panels.human) || hasPanelContent(panels.crawler);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Input bar */}
      <div className="border-b px-4 py-3 bg-background shrink-0 space-y-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-end">
            <DomainField
              value={
                lockedDomain !== null
                  ? getHostname(lockedDomain, environment, {
                      localPort: localPort.trim(),
                    })
                  : domainInput
              }
              isLocked={lockedDomain !== null}
              onChange={setDomainInput}
              onCommit={handleDomainCommit}
              onClear={handleDomainClear}
            />

            <PageField
              value={pageInput}
              onChange={setPageInput}
              inputRef={pageInputRef}
            />

            <EnvironmentSelect
              value={environment}
              onChange={setEnvironment}
              disabled={lockedDomain === null}
              environments={availableEnvironments}
            />

            {requiresPort && (
              <PortField
                id="local-port"
                value={localPort}
                onChange={setLocalPort}
              />
            )}

            <CrawlerSelect value={crawlerId} onChange={setCrawlerId} />

            <LoadingButton
              type="submit"
              disabled={!canSubmit}
              isLoading={isLoading}
              loadingLabel="Comparing…"
              className="h-9 shrink-0 self-end"
            >
              Compare
            </LoadingButton>
          </div>

          {requiresAuth && (
            <div className="flex flex-wrap gap-2 items-center">
              <CredentialFields
                credentials={currentCredentials}
                onChange={(field, value) =>
                  updateCredential(environment, field, value)
                }
                labelClassName="mr-1"
              />
            </div>
          )}
        </form>

        {isLoading && (
          <p className="text-xs text-muted-foreground">
            Fetching Human Experience with Playwright (JS rendering + scroll)…
            this may take up to 30s.
          </p>
        )}

        {error && <InlineAlert tone="error">{error}</InlineAlert>}
      </div>

      <ComparisonWorkspace
        entries={history.entries.map(toSidebarEntry)}
        activeId={history.activeId}
        emptyMessage="No comparisons yet. Submit a URL above."
        onSelect={handleSelect}
        onRemove={handleRemove}
      >
        {showResults ? (
          <>
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ViewToggle
                  value={viewMode}
                  onChange={setViewMode}
                  modes={["rendered", "raw", "diff"]}
                />
                {viewMode === "diff" && (
                  <DiffModeToggle value={diffMode} onChange={setDiffMode} />
                )}
              </div>
              {history.activeEntry && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {history.activeEntry.environment}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {history.activeEntry.crawlerLabel}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-1 gap-3 overflow-hidden min-h-0">
              <div
                className={cn(
                  "flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden",
                  viewMode === "diff" && "hidden",
                )}
              >
                <OutputPanel
                  title="Source: Human Experience"
                  icon={<User className="w-3.5 h-3.5" />}
                  markdown={panels.human.markdown}
                  viewMode={viewMode}
                  warning={panels.human.warning}
                  error={panels.human.error}
                />
              </div>
              <OutputPanel
                title="Source: AI Crawler Experience"
                icon={<Bot className="w-3.5 h-3.5" />}
                markdown={panels.crawler.markdown}
                viewMode={viewMode}
                warning={panels.crawler.warning}
                error={panels.crawler.error}
                diffBase={viewMode === "diff" ? panels.human.markdown : undefined}
                diffMode={diffMode}
              />
            </div>
          </>
        ) : (
          <EmptyState
            message="Enter a URL and click Compare."
            hint={
              <>
                Left panel uses Playwright (full JS render + scroll).
                <br />
                Right panel uses a direct fetch with the selected AI crawler user
                agent.
              </>
            }
          />
        )}
      </ComparisonWorkspace>
    </div>
  );
}
