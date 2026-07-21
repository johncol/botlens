export type AiCrawler = {
  id: string;
  label: string;
  userAgent: string;
};

export const AI_CRAWLERS: AiCrawler[] = [
  {
    id: "gptbot",
    label: "GPTBot (OpenAI)",
    userAgent:
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)",
  },
  {
    id: "oai-searchbot",
    label: "OAI-SearchBot (OpenAI)",
    userAgent:
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)",
  },
  {
    id: "claudebot",
    label: "ClaudeBot (Anthropic)",
    userAgent:
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +https://www.anthropic.com/claude-web)",
  },
  {
    id: "anthropic-ai",
    label: "anthropic-ai (Anthropic)",
    userAgent:
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; anthropic-ai/1.0; +https://www.anthropic.com/claude-web)",
  },
  {
    id: "google-extended",
    label: "Google-Extended (Google AI)",
    userAgent:
      "Mozilla/5.0 (compatible; Google-Extended/1.0; +http://www.google.com/bot.html)",
  },
  {
    id: "googlebot",
    label: "Googlebot (Google)",
    userAgent:
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  },
  {
    id: "perplexitybot",
    label: "PerplexityBot (Perplexity)",
    userAgent:
      "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
  },
  {
    id: "ccbot",
    label: "CCBot (Common Crawl)",
    userAgent: "CCBot/2.0 (https://commoncrawl.org/faq/)",
  },
  {
    id: "cohere-ai",
    label: "cohere-ai (Cohere)",
    userAgent: "CohereBot/1.0 (+https://cohere.com)",
  },
  {
    id: "meta-externalagent",
    label: "Meta-ExternalAgent (Meta)",
    userAgent:
      "Meta-ExternalAgent/1.1 (https://developers.facebook.com/docs/sharing/webmasters/web-crawlers)",
  },
];

export const DEFAULT_CRAWLER_ID = "gptbot";
