"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { diffLines } from "diff";
import { CrawlerComparisonEntry, SidebarEntry } from "@/types";
import {
  loadHistory,
  addHistoryEntry,
  removeHistoryEntry,
  CRAWLER_COMPARISON_KEY,
} from "@/lib/history";
import {
  ENVIRONMENTS,
  ENVIRONMENT_ORDER,
  getHostname,
  buildUrl,
  type Environment,
} from "@/lib/environments";
import { cn } from "@/lib/utils";
import { AI_CRAWLERS, DEFAULT_CRAWLER_ID } from "@/lib/crawlers";
import type { CrawlerComparisonInitialValues } from "@/lib/crawler-prefill";
import { HistorySidebar } from "@/components/HistorySidebar";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import {
  useCopyLinkToast,
  CopyLinkToast,
  makeLinkComponents,
} from "@/components/MarkdownLinkCopy";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, Bot, User, X, Lock } from "lucide-react";

function toSidebarEntry(e: CrawlerComparisonEntry): SidebarEntry {
  try {
    const path = new URL(e.url).pathname;
    return {
      id: e.id,
      label: `${path} (${e.environment})`,
      badge: e.crawlerLabel,
      createdAt: e.createdAt,
    };
  } catch {
    return {
      id: e.id,
      label: e.url,
      badge: e.crawlerLabel,
      createdAt: e.createdAt,
    };
  }
}

interface PanelProps {
  title: string;
  icon: React.ReactNode;
  markdown: string | null;
  viewMode: ViewMode;
  warning?: string;
  /** When viewMode === 'diff', diff the crawler content against this base */
  diffBase?: string | null;
}

function OutputPanel({
  title,
  icon,
  markdown,
  viewMode,
  warning,
  diffBase,
}: PanelProps) {
  const [warningDismissed, setWarningDismissed] = useState(false);
  const { copiedUrl, triggerCopy } = useCopyLinkToast();
  const linkComponents = makeLinkComponents(triggerCopy);

  useEffect(() => {
    setWarningDismissed(false);
  }, [warning]);

  const diffChunks = useMemo(() => {
    if (viewMode !== "diff" || diffBase == null || markdown == null)
      return null;
    return diffLines(diffBase, markdown);
  }, [viewMode, diffBase, markdown]);

  const diffStats = useMemo(() => {
    if (!diffChunks) return null;
    let removed = 0;
    let added = 0;
    for (const chunk of diffChunks) {
      if (chunk.removed) removed += chunk.count ?? 0;
      if (chunk.added) added += chunk.count ?? 0;
    }
    return { removed, added };
  }, [diffChunks]);

  return (
    <div className="flex flex-col flex-1 min-w-0 min-h-0 border rounded-lg overflow-hidden">
      <div className="px-4 py-2 border-b bg-muted/40 shrink-0 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        {diffStats && (
          <div className="ml-auto flex items-center gap-1.5">
            {diffStats.removed > 0 && (
              <span className="text-xs font-mono font-medium text-red-600 dark:text-red-400">
                −{diffStats.removed}
              </span>
            )}
            {diffStats.added > 0 && (
              <span className="text-xs font-mono font-medium text-green-600 dark:text-green-400">
                +{diffStats.added}
              </span>
            )}
            {diffStats.removed === 0 && diffStats.added === 0 && (
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                identical
              </span>
            )}
          </div>
        )}
      </div>
      {warning && !warningDismissed && (
        <div className="flex items-start gap-1.5 px-4 py-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />
          <span className="flex-1">{warning}</span>
          <button
            type="button"
            aria-label="Dismiss warning"
            onClick={() => setWarningDismissed(true)}
            className="shrink-0 ml-1 text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {markdown !== null ? (
          viewMode === "diff" && diffChunks ? (
            <pre className="text-xs font-mono whitespace-pre-wrap break-words p-4 leading-5">
              {diffChunks.map((chunk, i) => {
                const prefix = chunk.removed ? "-" : chunk.added ? "+" : " ";
                const cls = chunk.removed
                  ? "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300"
                  : chunk.added
                    ? "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300"
                    : "text-foreground";
                // chunk.value ends with \n; split produces trailing empty string — drop it
                const lines = chunk.value.split("\n");
                if (lines[lines.length - 1] === "") lines.pop();
                return lines.map((line, j) => (
                  <span key={`${i}-${j}`} className={`block ${cls}`}>
                    {prefix} {line}
                  </span>
                ));
              })}
            </pre>
          ) : markdown.trim() ? (
            <div className="p-4">
              {viewMode === "rendered" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={linkComponents}>
                    {markdown}
                  </ReactMarkdown>
                  <CopyLinkToast url={copiedUrl} />
                </div>
              ) : (
                <pre className="text-xs font-mono whitespace-pre-wrap break-words text-foreground">
                  {markdown}
                </pre>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[120px] text-muted-foreground text-xs px-4 text-center">
              No readable text returned.
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full min-h-[120px] text-muted-foreground text-xs">
            Submit a URL above to see results.
          </div>
        )}
      </div>
    </div>
  );
}

interface AiCrawlerRenderComparisonClientProps {
  initialValues: CrawlerComparisonInitialValues;
}

export default function AiCrawlerRenderComparisonClient({
  initialValues,
}: AiCrawlerRenderComparisonClientProps) {
  const [history, setHistory] = useState<CrawlerComparisonEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Domain is stored as the raw production hostname the user entered.
  // null = not yet locked.
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

  const pageInputRef = useRef<HTMLInputElement>(null);

  const [humanMarkdown, setHumanMarkdown] = useState<string | null>(null);
  const [crawlerMarkdown, setCrawlerMarkdown] = useState<string | null>(null);
  const [humanWarning, setHumanWarning] = useState<string | undefined>(
    undefined,
  );
  const [crawlerWarning, setCrawlerWarning] = useState<string | undefined>(
    undefined,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("rendered");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Credentials stored per-env in React state only — never persisted anywhere
  const [envCredentials, setEnvCredentials] = useState<
    Partial<Record<Environment, { username: string; password: string }>>
  >(initialValues.credentials);

  useEffect(() => {
    setHistory(loadHistory<CrawlerComparisonEntry>(CRAWLER_COMPARISON_KEY));
  }, []);

  // Focus the page input whenever the domain becomes locked
  useEffect(() => {
    if (lockedDomain !== null) {
      pageInputRef.current?.focus();
    }
  }, [lockedDomain]);

  /**
   * Parse whatever the user typed into the domain field:
   * - Extract hostname if they pasted a full URL
   * - Detect env from known subdomain patterns (e.g. staging.example.com → staging)
   * - Return the production domain and detected env
   */
  function parseDomainInput(raw: string): {
    prodDomain: string;
    env: Environment;
  } {
    let hostname = raw.trim();
    try {
      const withScheme = hostname.includes("://")
        ? hostname
        : `https://${hostname}`;
      hostname = new URL(withScheme).hostname;
    } catch {
      /* keep as-is */
    }

    for (const env of ENVIRONMENT_ORDER) {
      const { subdomain } = ENVIRONMENTS[env];
      if (subdomain === null) continue;
      const prefix = `${subdomain}.`;
      if (hostname.startsWith(prefix)) {
        return { prodDomain: hostname.slice(prefix.length), env };
      }
    }

    return { prodDomain: hostname, env: "production" };
  }

  function handleDomainCommit() {
    if (!domainInput.trim()) return;
    const { prodDomain, env } = parseDomainInput(domainInput);
    setLockedDomain(prodDomain);
    setEnvironment(env);
  }

  function handleDomainClear() {
    setLockedDomain(null);
    setDomainInput("");
    setEnvironment("production");
  }

  function handlePageBlur() {
    setPageInput((prev) => {
      try {
        const parsed = new URL(prev);
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      } catch {
        return prev;
      }
    });
  }

  const requiresAuth = ENVIRONMENTS[environment].requiresAuth;
  const currentCreds = envCredentials[environment] ?? {
    username: "",
    password: "",
  };
  const canSubmit =
    !isLoading &&
    lockedDomain !== null &&
    pageInput.trim().length > 0 &&
    (!requiresAuth ||
      (currentCreds.username.trim().length > 0 &&
        currentCreds.password.trim().length > 0));

  function handleCredentialChange(
    field: "username" | "password",
    value: string,
  ) {
    setEnvCredentials((prev) => ({
      ...prev,
      [environment]: {
        ...(prev[environment] ?? { username: "", password: "" }),
        [field]: value,
      },
    }));
  }

  const selectedCrawler =
    AI_CRAWLERS.find((c) => c.id === crawlerId) ?? AI_CRAWLERS[0];

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!lockedDomain || !pageInput.trim()) return;

      // Strip domain if user pasted a full URL into the page field
      let path = pageInput.trim();
      try {
        const parsed = new URL(path);
        path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
        setPageInput(path);
      } catch {
        /* keep as-is */
      }

      const fullUrl = buildUrl(lockedDomain, path, environment);

      const requiresAuth = ENVIRONMENTS[environment].requiresAuth;
      const currentCreds = envCredentials[environment] ?? {
        username: "",
        password: "",
      };

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/crawler-compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: fullUrl,
            environment,
            crawlerUserAgent: selectedCrawler.userAgent,
            ...(requiresAuth && {
              username: currentCreds.username,
              password: currentCreds.password,
            }),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Comparison failed");
          return;
        }

        setHumanMarkdown(data.humanMarkdown);
        setCrawlerMarkdown(data.crawlerMarkdown);
        setHumanWarning(data.humanWarning ?? undefined);
        setCrawlerWarning(data.crawlerWarning ?? undefined);

        const entry: Omit<CrawlerComparisonEntry, "id" | "createdAt"> = {
          url: data.resolvedUrl ?? fullUrl,
          environment: ENVIRONMENTS[environment].label,
          crawlerLabel: selectedCrawler.label,
          humanMarkdown: data.humanMarkdown,
          crawlerMarkdown: data.crawlerMarkdown,
        };

        setHistory((prev) => {
          const updated = addHistoryEntry<CrawlerComparisonEntry>(
            CRAWLER_COMPARISON_KEY,
            prev,
            entry,
          );
          setActiveId(updated[0].id);
          return updated;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error");
      } finally {
        setIsLoading(false);
      }
    },
    [lockedDomain, pageInput, environment, selectedCrawler, envCredentials],
  );

  const handleSelect = useCallback(
    (entry: SidebarEntry) => {
      const full = history.find((e) => e.id === entry.id);
      if (!full) return;
      setActiveId(full.id);
      setHumanMarkdown(full.humanMarkdown);
      setCrawlerMarkdown(full.crawlerMarkdown);
      setHumanWarning(undefined);
      setCrawlerWarning(undefined);

      // Restore domain + page from stored URL
      try {
        const parsed = new URL(full.url);
        const { prodDomain, env } = parseDomainInput(parsed.hostname);
        setLockedDomain(prodDomain);
        setEnvironment(env);
        setPageInput(`${parsed.pathname}${parsed.search}${parsed.hash}`);
      } catch {
        setPageInput(full.url);
      }
      setError(null);
    },
    [history],
  );

  const handleRemove = useCallback(
    (id: string) => {
      setHistory((prev) => {
        const updated = removeHistoryEntry<CrawlerComparisonEntry>(
          CRAWLER_COMPARISON_KEY,
          prev,
          id,
        );
        if (activeId === id) {
          const next = updated[0] ?? null;
          setActiveId(next?.id ?? null);
          setHumanMarkdown(next?.humanMarkdown ?? null);
          setCrawlerMarkdown(next?.crawlerMarkdown ?? null);
          setHumanWarning(undefined);
          setCrawlerWarning(undefined);
        }
        return updated;
      });
    },
    [activeId],
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Input bar */}
      <div className="border-b px-4 py-3 bg-background shrink-0 space-y-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-end">
            {/* Domain */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">
                Domain
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={
                    lockedDomain !== null
                      ? getHostname(lockedDomain, environment)
                      : domainInput
                  }
                  onChange={(e) => {
                    if (lockedDomain !== null) return;
                    setDomainInput(e.target.value);
                  }}
                  onBlur={() => {
                    if (lockedDomain === null) handleDomainCommit();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (lockedDomain === null) handleDomainCommit();
                    }
                  }}
                  readOnly={lockedDomain !== null}
                  placeholder="example.com"
                  required
                  className={cn(
                    "h-9 px-3 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    lockedDomain !== null &&
                      "pr-8 bg-muted text-muted-foreground cursor-default select-none",
                  )}
                />
                {lockedDomain !== null && (
                  <button
                    type="button"
                    onClick={handleDomainClear}
                    aria-label="Clear domain"
                    className="absolute right-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Page */}
            <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
              <label className="text-xs text-muted-foreground font-medium">
                Page
              </label>
              <input
                ref={pageInputRef}
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePageBlur();
                }}
                placeholder="/en/clothing"
                required
                className="h-9 px-3 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Environment */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as Environment)}
                disabled={lockedDomain === null}
                className="h-9 px-2 pr-7 text-sm rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ENVIRONMENT_ORDER.map((env) => (
                  <option key={env} value={env}>
                    {ENVIRONMENTS[env].label}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Crawler */}
            <div className="flex flex-col gap-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground font-medium">
                AI Crawler
              </label>
              <select
                value={crawlerId}
                onChange={(e) => setCrawlerId(e.target.value)}
                className="h-9 px-2 pr-7 text-sm rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {AI_CRAWLERS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-9 shrink-0 self-end"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Comparing…
                </>
              ) : (
                "Compare"
              )}
            </Button>
          </div>

          {requiresAuth && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mr-1">
                <Lock className="w-3 h-3" />
                Credentials
              </span>
              <input
                type="text"
                autoComplete="username"
                value={currentCreds.username}
                onChange={(e) =>
                  handleCredentialChange("username", e.target.value)
                }
                placeholder="Username"
                className="h-9 px-3 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-40"
              />
              <input
                type="password"
                autoComplete="current-password"
                value={currentCreds.password}
                onChange={(e) =>
                  handleCredentialChange("password", e.target.value)
                }
                placeholder="Password"
                className="h-9 px-3 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-48"
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

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <HistorySidebar
          entries={history.map(toSidebarEntry)}
          activeId={activeId}
          emptyMessage="No comparisons yet. Submit a URL above."
          onSelect={handleSelect}
          onRemove={handleRemove}
        />

        <main className="flex flex-col flex-1 overflow-hidden p-4 gap-3">
          {humanMarkdown !== null || crawlerMarkdown !== null ? (
            <>
              <div className="flex items-center justify-between shrink-0">
                <ViewToggle
                  value={viewMode}
                  onChange={setViewMode}
                  modes={["rendered", "raw", "diff"]}
                />
                {activeId && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {history.find((e) => e.id === activeId)?.environment ??
                        ""}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {history.find((e) => e.id === activeId)?.crawlerLabel ??
                        ""}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 gap-3 overflow-hidden min-h-0">
                <OutputPanel
                  title="Source: Human Experience"
                  icon={<User className="w-3.5 h-3.5" />}
                  markdown={humanMarkdown}
                  viewMode={viewMode === "diff" ? "raw" : viewMode}
                  warning={humanWarning}
                />
                <OutputPanel
                  title="Source: AI Crawler Experience"
                  icon={<Bot className="w-3.5 h-3.5" />}
                  markdown={crawlerMarkdown}
                  viewMode={viewMode}
                  warning={crawlerWarning}
                  diffBase={viewMode === "diff" ? humanMarkdown : undefined}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-center">
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">
                  Enter a URL and click Compare.
                </p>
                <p className="text-xs text-muted-foreground">
                  Left panel uses Playwright (full JS render + scroll).
                  <br />
                  Right panel uses a direct fetch with the selected AI crawler
                  user agent.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
