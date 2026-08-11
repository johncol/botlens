"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { EnvVsEnvEntry, SidebarEntry } from "@/types";
import {
  loadHistory,
  addHistoryEntry,
  removeHistoryEntry,
  ENV_COMPARISON_KEY,
} from "@/lib/history";
import {
  ENVIRONMENTS,
  ENVIRONMENT_ORDER,
  type Environment,
} from "@/lib/environments";
import { cn } from "@/lib/utils";
import { AI_CRAWLERS, DEFAULT_CRAWLER_ID } from "@/lib/crawlers";
import type { PageInitialValues } from "@/lib/page-prefill";
import { HistorySidebar } from "@/components/HistorySidebar";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { CrawlerSelect } from "@/components/CrawlerSelect";
import { OutputPanel } from "@/components/OutputPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, GitCompare, X, Lock } from "lucide-react";

const TAG_FILTER_OPTIONS = ["body", "header", "nav", "main", "footer"] as const;
type TagFilter = (typeof TAG_FILTER_OPTIONS)[number];
const DEFAULT_TAG_FILTER: TagFilter = "main";

function toSidebarEntry(e: EnvVsEnvEntry): SidebarEntry {
  return {
    id: e.id,
    label: `${e.page} (${e.leftEnvironment} vs ${e.rightEnvironment})`,
    badge: e.crawlerLabel,
    createdAt: e.createdAt,
  };
}

interface EnvVsEnvClientProps {
  initialValues: PageInitialValues;
}

export default function EnvVsEnvClient({
  initialValues,
}: EnvVsEnvClientProps) {
  const [history, setHistory] = useState<EnvVsEnvEntry[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loadHistory<EnvVsEnvEntry>(ENV_COMPARISON_KEY));
  }, []);

  const [activeId, setActiveId] = useState<string | null>(null);

  const [domainInput, setDomainInput] = useState(initialValues.domain);
  const [lockedDomain, setLockedDomain] = useState<string | null>(() =>
    initialValues.domain.trim() ? parseDomainInput(initialValues.domain).prodDomain : null,
  );
  const [pageInput, setPageInput] = useState(initialValues.page);
  const [tagFilter, setTagFilter] = useState<TagFilter>(DEFAULT_TAG_FILTER);
  const [leftEnv, setLeftEnv] = useState<Environment>("production");
  const [rightEnv, setRightEnv] = useState<Environment>("development");
  const [crawlerId, setCrawlerId] = useState(DEFAULT_CRAWLER_ID);

  const pageInputRef = useRef<HTMLInputElement>(null);

  const [leftMarkdown, setLeftMarkdown] = useState<string | null>(null);
  const [rightMarkdown, setRightMarkdown] = useState<string | null>(null);
  const [leftWarning, setLeftWarning] = useState<string | undefined>(undefined);
  const [rightWarning, setRightWarning] = useState<string | undefined>(undefined);
  const [leftError, setLeftError] = useState<string | undefined>(undefined);
  const [rightError, setRightError] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>("rendered");
  const [diffMode, setDiffMode] = useState<"exact" | "smart">("exact");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [envCredentials, setEnvCredentials] = useState<
    Partial<Record<Environment, { username: string; password: string }>>
  >(initialValues.credentials);

  useEffect(() => {
    if (lockedDomain !== null) {
      pageInputRef.current?.focus();
    }
  }, [lockedDomain]);

  function parseDomainInput(raw: string): { prodDomain: string; env: Environment } {
    let hostname = raw.trim();
    try {
      const withScheme = hostname.includes("://") ? hostname : `https://${hostname}`;
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
    const { prodDomain } = parseDomainInput(domainInput);
    setLockedDomain(prodDomain);
  }

  function handleDomainClear() {
    setLockedDomain(null);
    setDomainInput("");
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

  const leftRequiresAuth = ENVIRONMENTS[leftEnv].requiresAuth;
  const rightRequiresAuth = ENVIRONMENTS[rightEnv].requiresAuth;
  const leftCreds = useMemo(
    () => envCredentials[leftEnv] ?? { username: "", password: "" },
    [envCredentials, leftEnv],
  );
  const rightCreds = useMemo(
    () => envCredentials[rightEnv] ?? { username: "", password: "" },
    [envCredentials, rightEnv],
  );

  const canSubmit =
    !isLoading &&
    lockedDomain !== null &&
    pageInput.trim().length > 0 &&
    (!leftRequiresAuth || (leftCreds.username.trim() && leftCreds.password.trim())) &&
    (!rightRequiresAuth || (rightCreds.username.trim() && rightCreds.password.trim()));

  function handleCredentialChange(
    env: Environment,
    field: "username" | "password",
    value: string,
  ) {
    setEnvCredentials((prev) => ({
      ...prev,
      [env]: {
        ...(prev[env] ?? { username: "", password: "" }),
        [field]: value,
      },
    }));
  }

  const selectedCrawler = AI_CRAWLERS.find((c) => c.id === crawlerId) ?? AI_CRAWLERS[0];

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!lockedDomain || !pageInput.trim()) return;

      let path = pageInput.trim();
      try {
        const parsed = new URL(path);
        path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
        setPageInput(path);
      } catch {
        /* keep as-is */
      }

      setIsLoading(true);
      setError(null);

      const credentialsPayload: Partial<Record<Environment, { username: string; password: string }>> = {};
      if (leftRequiresAuth && leftCreds.username && leftCreds.password) {
        credentialsPayload[leftEnv] = leftCreds;
      }
      if (rightRequiresAuth && rightCreds.username && rightCreds.password) {
        credentialsPayload[rightEnv] = rightCreds;
      }

      try {
        const res = await fetch("/api/env-vs-env", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain: lockedDomain,
            page: path,
            leftEnvironment: leftEnv,
            rightEnvironment: rightEnv,
            crawlerUserAgent: selectedCrawler.userAgent,
            tagFilter,
            credentials: credentialsPayload,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Comparison failed");
          return;
        }

        setLeftMarkdown(data.leftMarkdown);
        setRightMarkdown(data.rightMarkdown);
        setLeftWarning(data.leftWarning ?? undefined);
        setRightWarning(data.rightWarning ?? undefined);
        setLeftError(data.leftError ?? undefined);
        setRightError(data.rightError ?? undefined);

        const entry: Omit<EnvVsEnvEntry, "id" | "createdAt"> = {
          domain: lockedDomain,
          page: path,
          tagFilter,
          crawlerLabel: selectedCrawler.label,
          leftEnvironment: ENVIRONMENTS[leftEnv].label,
          rightEnvironment: ENVIRONMENTS[rightEnv].label,
          leftMarkdown: data.leftMarkdown,
          rightMarkdown: data.rightMarkdown,
          leftWarning: data.leftWarning,
          rightWarning: data.rightWarning,
          leftError: data.leftError,
          rightError: data.rightError,
        };

        setHistory((prev) => {
          const updated = addHistoryEntry<EnvVsEnvEntry>(
            ENV_COMPARISON_KEY,
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
    [
      lockedDomain,
      pageInput,
      leftEnv,
      rightEnv,
      tagFilter,
      selectedCrawler,
      leftRequiresAuth,
      rightRequiresAuth,
      leftCreds,
      rightCreds,
    ],
  );

  const handleSelect = useCallback(
    (entry: SidebarEntry) => {
      const full = history.find((e) => e.id === entry.id);
      if (!full) return;
      setActiveId(full.id);
      setLeftMarkdown(full.leftMarkdown);
      setRightMarkdown(full.rightMarkdown);
      setLeftWarning(full.leftWarning);
      setRightWarning(full.rightWarning);
      setLeftError(full.leftError);
      setRightError(full.rightError);
      setLockedDomain(full.domain);
      setPageInput(full.page);
      setTagFilter(full.tagFilter as TagFilter);
      setError(null);
    },
    [history],
  );

  const handleRemove = useCallback(
    (id: string) => {
      setHistory((prev) => {
        const updated = removeHistoryEntry<EnvVsEnvEntry>(ENV_COMPARISON_KEY, prev, id);
        if (activeId === id) {
          const next = updated[0] ?? null;
          setActiveId(next?.id ?? null);
          setLeftMarkdown(next?.leftMarkdown ?? null);
          setRightMarkdown(next?.rightMarkdown ?? null);
          setLeftError(next?.leftError);
          setRightError(next?.rightError);
          setLeftWarning(next?.leftWarning);
          setRightWarning(next?.rightWarning);
        }
        return updated;
      });
    },
    [activeId],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Input bar */}
      <div className="border-b px-4 py-3 bg-background shrink-0 space-y-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {/* Row 1: global fields */}
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
                      ? lockedDomain
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

            {/* Tag Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground font-medium">
                HTML Tag
              </label>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value as TagFilter)}
                className="h-9 px-2 pr-7 text-sm rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {TAG_FILTER_OPTIONS.map((tag) => (
                  <option key={tag} value={tag}>
                    &lt;{tag}&gt;
                  </option>
                ))}
              </select>
            </div>

            {/* AI Crawler */}
            <CrawlerSelect value={crawlerId} onChange={setCrawlerId} />

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

          {/* Row 2: per-panel env selectors + credentials */}
          <div className="flex items-end justify-between gap-2">
            {/* Left side */}
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">
                  Left (base)
                </label>
                <select
                  value={leftEnv}
                  onChange={(e) => setLeftEnv(e.target.value as Environment)}
                  disabled={lockedDomain === null}
                  className="h-9 px-2 pr-7 text-sm rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ENVIRONMENT_ORDER.map((env) => (
                    <option key={env} value={env} disabled={env === rightEnv}>
                      {ENVIRONMENTS[env].label}
                    </option>
                  ))}
                </select>
              </div>
              <span className={cn(
                "text-xs flex items-center gap-1 pb-2",
                leftRequiresAuth
                  ? "text-brand"
                  : "text-muted-foreground opacity-40",
              )}>
                <Lock className="w-3 h-3" />
                Credentials
              </span>
              <input
                type="text"
                autoComplete="username"
                disabled={!leftRequiresAuth}
                value={leftCreds.username}
                onChange={(e) =>
                  handleCredentialChange(leftEnv, "username", e.target.value)
                }
                placeholder="Username"
                className="h-9 px-3 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-32 disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <input
                type="password"
                autoComplete="current-password"
                disabled={!leftRequiresAuth}
                value={leftCreds.password}
                onChange={(e) =>
                  handleCredentialChange(leftEnv, "password", e.target.value)
                }
                placeholder="Password"
                className="h-9 px-3 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-36 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            {/* Right side */}
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">
                  Right
                </label>
                <select
                  value={rightEnv}
                  onChange={(e) => setRightEnv(e.target.value as Environment)}
                  disabled={lockedDomain === null}
                  className="h-9 px-2 pr-7 text-sm rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ENVIRONMENT_ORDER.map((env) => (
                    <option key={env} value={env} disabled={env === leftEnv}>
                      {ENVIRONMENTS[env].label}
                    </option>
                  ))}
                </select>
              </div>
              <span className={cn(
                "text-xs flex items-center gap-1 pb-2",
                rightRequiresAuth
                  ? "text-brand"
                  : "text-muted-foreground opacity-40",
              )}>
                <Lock className="w-3 h-3" />
                Credentials
              </span>
              <input
                type="text"
                autoComplete="username"
                disabled={!rightRequiresAuth}
                value={rightCreds.username}
                onChange={(e) =>
                  handleCredentialChange(rightEnv, "username", e.target.value)
                }
                placeholder="Username"
                className="h-9 px-3 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-32 disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <input
                type="password"
                autoComplete="current-password"
                disabled={!rightRequiresAuth}
                value={rightCreds.password}
                onChange={(e) =>
                  handleCredentialChange(rightEnv, "password", e.target.value)
                }
                placeholder="Password"
                className="h-9 px-3 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-36 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </form>

        {isLoading && (
          <p className="text-xs text-muted-foreground">
            Fetching both environments as AI crawler… this may take up to 30s.
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
          {leftMarkdown !== null ||
          rightMarkdown !== null ||
          leftError ||
          rightError ? (
            <>
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <ViewToggle
                    value={viewMode}
                    onChange={setViewMode}
                    modes={["rendered", "raw", "diff"]}
                  />
                  {viewMode === "diff" && (
                    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                      {(["exact", "smart"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setDiffMode(mode)}
                          className={cn(
                            "px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize",
                            diffMode === mode
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {mode === "exact" ? "Exact" : "Smart"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {activeId && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {history.find((e) => e.id === activeId)?.tagFilter ?? ""}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {history.find((e) => e.id === activeId)?.crawlerLabel ?? ""}
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
                    title={`Left: ${ENVIRONMENTS[leftEnv].label}`}
                    icon={<GitCompare className="w-3.5 h-3.5" />}
                    markdown={leftMarkdown}
                    viewMode={viewMode}
                    warning={leftWarning}
                    error={leftError}
                  />
                </div>
                <OutputPanel
                  title={`Right: ${ENVIRONMENTS[rightEnv].label}`}
                  icon={<GitCompare className="w-3.5 h-3.5" />}
                  markdown={rightMarkdown}
                  viewMode={viewMode}
                  warning={rightWarning}
                  error={rightError}
                  diffBase={viewMode === "diff" ? leftMarkdown : undefined}
                  diffMode={diffMode}
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
                  Both panels fetch the page as the selected AI crawler.
                  <br />
                  Left panel is the base for diffs.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
