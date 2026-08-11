# BotLens

A local dev tool for inspecting how AI crawlers see your pages and comparing HTML-to-markdown converters.

## Tools

- **Human vs Bot** — Compare what a human sees (full JS-rendered page via Playwright) vs what an AI crawler sees (raw fetch with a bot user agent) for the same URL. Supports multiple environments and 10 AI crawler user agents.
- **Env vs Env** — Fetch the same page from two different environments (e.g. production vs development) using an AI crawler and compare the markdown output side by side.
- **Page Comparison** — Convert two different HTML sources with node-html-markdown and compare the results side by side. Useful for diffing a before/after, two versions of a page, or two different sites.
- **Library Comparison** — Paste a URL or HTML snippet and see the output side by side from two converters: Turndown and node-html-markdown. Useful for evaluating which library produces cleaner markdown for a given source.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

### Human vs Bot prefills

Copy `.env.example` to `.env.local` and set any values you want prefilled on
the Human vs Bot page. These variables are read only during local
development and only provide initial values; every input remains editable.

`DOMAIN` accepts a production hostname or URL. `PAGE` accepts a path or full
URL. Credentials can be configured independently for each protected
environment with `STAGING_USER` / `STAGING_PASSWORD`, `DEVELOPMENT_USER` /
`DEVELOPMENT_PASSWORD`, and `UAT_USER` / `UAT_PASSWORD`.

Credential prefills are sent to browser memory so the form can use them. They
are never persisted to local history and are ignored outside development.

### Vercel runtime parity check

Install Docker, then run the production API smoke test in the same AWS Lambda
Node.js major version used by Vercel:

```bash
npm run test:vercel
```

The test builds Next.js standalone output, verifies the traced deployment
artifact contains the externalized Chromium package and binary assets, starts
the production server in Linux, and calls `/api/human-vs-bot`. Override its
public test page with a representative URL containing a `<main>` element:

```bash
SMOKE_TEST_URL=https://example.com/page npm run test:vercel
```

## Deploying to Vercel

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `GATE_PASSWORD` | No | When set, enables password protection for the app. Users must enter this password to access the UI. Omit to disable auth entirely. |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | Local only | Path to a local Chromium executable for the Human vs Bot feature. Not needed on Vercel, where the traced `@sparticuz/chromium` assets are used. |

> **Note:** The `VERCEL` environment variable is set automatically by the Vercel platform and does not need to be configured manually.

### How Chromium works on Vercel

`@sparticuz/chromium` remains external to the Next.js bundle so its relative
file lookup works. `outputFileTracingIncludes` copies its compressed `bin/`
assets into the function artifact. On cold start, `executablePath()` extracts
those bundled assets into `/tmp`; warm invocations reuse `/tmp/chromium`.

The project pins Node.js 24 in `package.json`, matching the Docker parity image
and overriding any different Vercel dashboard default.
