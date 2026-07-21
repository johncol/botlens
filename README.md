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
