"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { EnvVsEnvEntry, PanelContent, SidebarEntry } from "@/types";
import { ENV_COMPARISON_KEY } from "@/lib/history";
import {
  ENVIRONMENTS,
  findEnvironmentByLabel,
  getAvailableEnvironments,
  isValidPort,
  parseDomainInput,
  toPathWithQuery,
  type Environment,
} from "@/lib/environments";
import {
  DEFAULT_TAG_FILTER,
  TAG_FILTERS,
  type TagFilter,
} from "@/lib/tag-filters";
import { EMPTY_PANEL, hasPanelContent } from "@/lib/panels";
import { cn } from "@/lib/utils";
import { AI_CRAWLERS, DEFAULT_CRAWLER_ID } from "@/lib/crawlers";
import type { PageInitialValues } from "@/lib/page-prefill";
import { useHistory } from "@/hooks/use-history";
import { useJsonRequest } from "@/hooks/use-json-request";
import {
  hasCompleteCredentials,
  useEnvironmentCredentials,
  type EnvironmentCredentials,
} from "@/hooks/use-environment-credentials";
import { ComparisonWorkspace } from "@/components/ComparisonWorkspace";
import { DiffModeToggle, type DiffMode } from "@/components/DiffModeToggle";
import { EmptyState } from "@/components/EmptyState";
import { InlineAlert } from "@/components/InlineAlert";
import { LoadingButton } from "@/components/LoadingButton";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { CrawlerSelect } from "@/components/CrawlerSelect";
import { OutputPanel } from "@/components/OutputPanel";
import { CredentialFields } from "@/components/form/CredentialFields";
import { DomainField } from "@/components/form/DomainField";
import { FormField } from "@/components/form/FormField";
import { PageField } from "@/components/form/PageField";
import { PortField } from "@/components/form/PortField";
import { FIELD_SELECT_CLASS } from "@/components/form/field-styles";
import { Badge } from "@/components/ui/badge";
import { GitCompare } from "lucide-react";

type EnvVsEnvResponse = {
  leftMarkdown: string | null;
  rightMarkdown: string | null;
  leftWarning?: string;
  rightWarning?: string;
  leftError?: string;
  rightError?: string;
};

function toSidebarEntry(entry: EnvVsEnvEntry): SidebarEntry {
  return {
    id: entry.id,
    label: `${entry.page} (${entry.leftEnvironment} vs ${entry.rightEnvironment})`,
    badge: entry.crawlerLabel,
    createdAt: entry.createdAt,
  };
}

function toPanels(entry: EnvVsEnvEntry | null) {
  return {
    left: {
      markdown: entry?.leftMarkdown ?? null,
      warning: entry?.leftWarning,
      error: entry?.leftError,
    },
    right: {
      markdown: entry?.rightMarkdown ?? null,
      warning: entry?.rightWarning,
      error: entry?.rightError,
    },
  };
}

interface EnvVsEnvClientProps {
  initialValues: PageInitialValues;
  isLocalAvailable: boolean;
}

export default function EnvVsEnvClient({
  initialValues,
  isLocalAvailable,
}: EnvVsEnvClientProps) {
  const history = useHistory<EnvVsEnvEntry>(ENV_COMPARISON_KEY);
  const { addEntry, removeEntry, findEntry, setActiveId } = history;

  const [domainInput, setDomainInput] = useState(initialValues.domain);
  const [lockedDomain, setLockedDomain] = useState<string | null>(() =>
    initialValues.domain.trim()
      ? parseDomainInput(initialValues.domain).prodDomain
      : null,
  );
  const [pageInput, setPageInput] = useState(initialValues.page);
  const [tagFilter, setTagFilter] = useState<TagFilter>(DEFAULT_TAG_FILTER);
  const [leftEnv, setLeftEnv] = useState<Environment>("production");
  const [rightEnv, setRightEnv] = useState<Environment>("development");
  const [crawlerId, setCrawlerId] = useState(DEFAULT_CRAWLER_ID);
  const [localPort, setLocalPort] = useState(initialValues.localPort);

  const availableEnvironments = getAvailableEnvironments(isLocalAvailable);
  const pageInputRef = useRef<HTMLInputElement>(null);

  const [renderedLeftEnv, setRenderedLeftEnv] = useState<Environment | null>(null);
  const [renderedRightEnv, setRenderedRightEnv] = useState<Environment | null>(null);

  const [panels, setPanels] = useState<{
    left: PanelContent;
    right: PanelContent;
  }>({ left: EMPTY_PANEL, right: EMPTY_PANEL });
  const [viewMode, setViewMode] = useState<ViewMode>("rendered");
  const [diffMode, setDiffMode] = useState<DiffMode>("exact");

  const { isLoading, error, setError, send } = useJsonRequest<EnvVsEnvResponse>(
    "/api/env-vs-env",
    "Comparison failed",
  );

  const { getCredentials, updateCredential } = useEnvironmentCredentials(
    initialValues.credentials,
  );

  useEffect(() => {
    if (lockedDomain !== null) {
      pageInputRef.current?.focus();
    }
  }, [lockedDomain]);

  function handleDomainCommit() {
    if (!domainInput.trim()) {
      return;
    }
    setLockedDomain(parseDomainInput(domainInput).prodDomain);
  }

  function handleDomainClear() {
    setLockedDomain(null);
    setDomainInput("");
  }

  const leftRequiresAuth = ENVIRONMENTS[leftEnv].requiresAuth;
  const rightRequiresAuth = ENVIRONMENTS[rightEnv].requiresAuth;
  const requiresPort = [leftEnv, rightEnv].some(
    (env) => ENVIRONMENTS[env].kind === "localhost",
  );
  const leftCredentials = getCredentials(leftEnv);
  const rightCredentials = getCredentials(rightEnv);

  const canSubmit =
    !isLoading &&
    lockedDomain !== null &&
    pageInput.trim().length > 0 &&
    (!requiresPort || isValidPort(localPort.trim())) &&
    (!leftRequiresAuth || hasCompleteCredentials(leftCredentials)) &&
    (!rightRequiresAuth || hasCompleteCredentials(rightCredentials));

  const selectedCrawler =
    AI_CRAWLERS.find((crawler) => crawler.id === crawlerId) ?? AI_CRAWLERS[0];

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!lockedDomain || !pageInput.trim()) {
        return;
      }

      const path = toPathWithQuery(pageInput.trim());
      setPageInput(path);

      const credentialsPayload: EnvironmentCredentials = {};
      if (leftRequiresAuth && hasCompleteCredentials(leftCredentials)) {
        credentialsPayload[leftEnv] = leftCredentials;
      }
      if (rightRequiresAuth && hasCompleteCredentials(rightCredentials)) {
        credentialsPayload[rightEnv] = rightCredentials;
      }

      const data = await send({
        domain: lockedDomain,
        page: path,
        leftEnvironment: leftEnv,
        rightEnvironment: rightEnv,
        crawlerUserAgent: selectedCrawler.userAgent,
        tagFilter,
        localPort: localPort.trim(),
        credentials: credentialsPayload,
      });
      if (!data) {
        return;
      }

      setRenderedLeftEnv(leftEnv);
      setRenderedRightEnv(rightEnv);
      setPanels({
        left: {
          markdown: data.leftMarkdown,
          warning: data.leftWarning,
          error: data.leftError,
        },
        right: {
          markdown: data.rightMarkdown,
          warning: data.rightWarning,
          error: data.rightError,
        },
      });

      addEntry({
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
      });
    },
    [
      lockedDomain,
      pageInput,
      leftEnv,
      rightEnv,
      tagFilter,
      localPort,
      selectedCrawler,
      leftRequiresAuth,
      rightRequiresAuth,
      leftCredentials,
      rightCredentials,
      send,
      addEntry,
    ],
  );

  const showEntry = useCallback((entry: EnvVsEnvEntry | null) => {
    setRenderedLeftEnv(
      entry ? findEnvironmentByLabel(entry.leftEnvironment, "production") : null,
    );
    setRenderedRightEnv(
      entry
        ? findEnvironmentByLabel(entry.rightEnvironment, "development")
        : null,
    );
    setPanels(toPanels(entry));
  }, []);

  const handleSelect = useCallback(
    (entry: SidebarEntry) => {
      const full = findEntry(entry.id);
      if (!full) {
        return;
      }
      setActiveId(full.id);
      showEntry(full);
      setLockedDomain(full.domain);
      setPageInput(full.page);
      setTagFilter(full.tagFilter as TagFilter);
      setError(null);
    },
    [findEntry, setActiveId, showEntry, setError],
  );

  const handleRemove = useCallback(
    (id: string) => {
      removeEntry(id, showEntry);
    },
    [removeEntry, showEntry],
  );

  const showResults =
    hasPanelContent(panels.left) || hasPanelContent(panels.right);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Input bar */}
      <div className="border-b px-4 py-3 bg-background shrink-0 space-y-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {/* Row 1: global fields */}
          <div className="flex flex-wrap gap-2 items-end">
            <DomainField
              value={lockedDomain ?? domainInput}
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

            <FormField label="HTML Tag">
              <select
                value={tagFilter}
                onChange={(event) =>
                  setTagFilter(event.target.value as TagFilter)
                }
                className={FIELD_SELECT_CLASS}
              >
                {TAG_FILTERS.map((tag) => (
                  <option key={tag} value={tag}>
                    &lt;{tag}&gt;
                  </option>
                ))}
              </select>
            </FormField>

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

          {/* Row 2: per-panel env selectors + credentials */}
          <div className="flex items-end justify-between gap-2">
            <div className="flex items-end gap-2">
              <FormField label="Left (base)">
                <select
                  value={leftEnv}
                  onChange={(event) =>
                    setLeftEnv(event.target.value as Environment)
                  }
                  disabled={lockedDomain === null}
                  className={FIELD_SELECT_CLASS}
                >
                  {availableEnvironments.map((env) => (
                    <option key={env} value={env} disabled={env === rightEnv}>
                      {ENVIRONMENTS[env].label}
                    </option>
                  ))}
                </select>
              </FormField>
              {ENVIRONMENTS[leftEnv].kind === "localhost" && (
                <PortField
                  id="left-local-port"
                  value={localPort}
                  onChange={setLocalPort}
                />
              )}
              <CredentialFields
                credentials={leftCredentials}
                onChange={(field, value) =>
                  updateCredential(leftEnv, field, value)
                }
                isEnabled={leftRequiresAuth}
                labelClassName="pb-2"
                usernameClassName="w-32"
                passwordClassName="w-36"
              />
            </div>

            <div className="flex items-end gap-2">
              <FormField label="Right">
                <select
                  value={rightEnv}
                  onChange={(event) =>
                    setRightEnv(event.target.value as Environment)
                  }
                  disabled={lockedDomain === null}
                  className={FIELD_SELECT_CLASS}
                >
                  {availableEnvironments.map((env) => (
                    <option key={env} value={env} disabled={env === leftEnv}>
                      {ENVIRONMENTS[env].label}
                    </option>
                  ))}
                </select>
              </FormField>
              {ENVIRONMENTS[rightEnv].kind === "localhost" && (
                <PortField
                  id="right-local-port"
                  value={localPort}
                  onChange={setLocalPort}
                />
              )}
              <CredentialFields
                credentials={rightCredentials}
                onChange={(field, value) =>
                  updateCredential(rightEnv, field, value)
                }
                isEnabled={rightRequiresAuth}
                labelClassName="pb-2"
                usernameClassName="w-32"
                passwordClassName="w-36"
              />
            </div>
          </div>
        </form>

        {isLoading && (
          <p className="text-xs text-muted-foreground">
            Fetching both environments as AI crawler… this may take up to 30s.
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
                    {history.activeEntry.tagFilter}
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
                  title={
                    renderedLeftEnv
                      ? `Left: ${ENVIRONMENTS[renderedLeftEnv].label}`
                      : "Left"
                  }
                  icon={<GitCompare className="w-3.5 h-3.5" />}
                  markdown={panels.left.markdown}
                  viewMode={viewMode}
                  warning={panels.left.warning}
                  error={panels.left.error}
                />
              </div>
              <OutputPanel
                title={
                  renderedRightEnv
                    ? `Right: ${ENVIRONMENTS[renderedRightEnv].label}`
                    : "Right"
                }
                icon={<GitCompare className="w-3.5 h-3.5" />}
                markdown={panels.right.markdown}
                viewMode={viewMode}
                warning={panels.right.warning}
                error={panels.right.error}
                diffBase={viewMode === "diff" ? panels.left.markdown : undefined}
                diffMode={diffMode}
              />
            </div>
          </>
        ) : (
          <EmptyState
            message="Enter a URL and click Compare."
            hint={
              <>
                Both panels fetch the page as the selected AI crawler.
                <br />
                Left panel is the base for diffs.
              </>
            }
          />
        )}
      </ComparisonWorkspace>
    </div>
  );
}
