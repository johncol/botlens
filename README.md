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
| `CHROMIUM_DOWNLOAD_URL` | No | Override the URL used to download the Chromium binary on Vercel. Defaults to the `@sparticuz/chromium` GitHub Releases tarball matching the installed package version (`v149.0.0`). Useful if you self-host the binary or need to pin a specific build. |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | Local only | Path to a local Chromium executable for the AI crawler comparison feature. Not needed on Vercel — Chromium is downloaded remotely via `@sparticuz/chromium`. |

> **Note:** The `VERCEL` environment variable is set automatically by the Vercel platform and does not need to be configured manually.

### How Chromium works on Vercel

The `@sparticuz/chromium` package ships a ~62 MB Chromium binary in its `bin/` directory. Vercel's output file tracer excludes binary files, and the Hobby plan has a 50 MB function size limit — so the local binary can never be used on Vercel.

Instead, on cold-start, `executablePath()` is passed a GitHub Releases download URL and `@sparticuz/chromium` fetches and decompresses the binary into `/tmp`. Subsequent warm invocations reuse the cached binary in `/tmp/chromium`, so the download only happens once per container lifetime.
