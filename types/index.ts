export type ConversionResult = {
  turndown: string;
  nodeHtmlMarkdown: string;
};

export type HistoryEntry = {
  id: string;
  label: string;
  type: "url" | "snippet";
  result: ConversionResult;
  createdAt: number;
};
export type PageComparisonEntry = {
  id: string;
  createdAt: number;
  leftLabel: string;
  rightLabel: string;
  leftMarkdown: string;
  rightMarkdown: string;
};

/** Minimal shape required by HistorySidebar */
export type SidebarEntry = {
  id: string;
  label: string;
  badge: string;
  createdAt: number;
};

/** One side of a side-by-side comparison. */
export type PanelContent = {
  markdown: string | null;
  warning?: string;
  error?: string;
};

export type CrawlerComparisonEntry = {
  id: string;
  createdAt: number;
  url: string;
  environment: string;
  crawlerLabel: string;
  humanMarkdown: string | null;
  crawlerMarkdown: string | null;
  humanWarning?: string;
  crawlerWarning?: string;
  humanError?: string;
  crawlerError?: string;
};

export type EnvVsEnvEntry = {
  id: string;
  createdAt: number;
  /** Production domain used to build both URLs. */
  domain: string;
  page: string;
  tagFilter: string;
  crawlerLabel: string;
  leftEnvironment: string;
  rightEnvironment: string;
  leftMarkdown: string | null;
  rightMarkdown: string | null;
  leftWarning?: string;
  rightWarning?: string;
  leftError?: string;
  rightError?: string;
};
