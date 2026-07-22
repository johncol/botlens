# BotLens

A local dev tool for inspecting how AI crawlers see your pages and comparing HTML-to-markdown converters.

## Tools

- **AI Crawler Comparison** — Compare what a human browser (JS-rendered via Playwright) sees vs what an AI crawler (raw fetch with bot user agent) sees for the same URL. Supports multiple environments and 10 AI crawler user agents including GPTBot and ClaudeBot.
- **Library Comparison** — Paste a URL or HTML snippet and compare Turndown vs node-html-markdown output side by side.
- **Page Comparison** — Convert two different HTML sources and diff the markdown results.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `GATE_PASSWORD` | No | When set, enables password protection for the app. Users must enter this password to access the UI. Omit to disable auth entirely. |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | Local only | Path to a local Chromium executable for the AI crawler comparison feature. Not needed on Vercel — Chromium is sourced automatically via `@sparticuz/chromium` when `VERCEL` is detected. |

> **Note:** The `VERCEL` environment variable is set automatically by the Vercel platform and does not need to be configured manually.
