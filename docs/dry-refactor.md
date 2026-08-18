# DRY refactor summary

This change removes repeated logic from the four tool pages and the three API
routes. The behaviour of the app does not change.

## What was duplicated, and how it is fixed

### 1. Request body parsing and error responses

Each API route parsed JSON in a try/catch block and built its own
`NextResponse.json({ error }, { status })`. Both now come from
`readJsonBody` and `jsonError` in [lib/api-validation.ts](../lib/api-validation.ts).

### 2. URL safety checks

Three routes repeated the same three steps: parse the URL, reject a scheme that
is not HTTP or HTTPS, and run the SSRF guard on Vercel. `validateFetchableUrl`
now does all three in one place. One guard protects every outbound fetch, so a
new route cannot forget a step.

### 3. Field validation for crawlers, environments, and credentials

The crawler user agent set, the environment name check, the "Local is not
available on Vercel" rule, the credentials check, and the tag filter list each
existed in two or three copies. They are now `validateCrawlerUserAgent`,
`validateEnvironmentName`, `validateEnvironmentReachable`,
`validateCredentials`, and `validateTagFilter`. `credentialsFor` keeps
credentials away from environments that do not need them.

### 4. Error extraction from unknown values

`err instanceof Error ? err.message : "Unknown error"` appeared eight times.
[lib/errors.ts](../lib/errors.ts) now holds `toErrorMessage`, plus `settledValue`
and `settledError` for the results of `Promise.allSettled`.

### 5. Tag filter list and the empty content warning

The allowed HTML tags existed in the API route and in the client. The warning
text for a page with no readable text existed in two routes.
[lib/tag-filters.ts](../lib/tag-filters.ts) holds the list, the default, the type
guard, and `emptyContentWarning`.

### 6. Domain and path parsing in the browser

`parseDomainInput` was copied word for word into two clients. The "strip the
origin from a pasted URL" block appeared four times. Both now live in
[lib/environments.ts](../lib/environments.ts) as `parseDomainInput` and
`toPathWithQuery`, together with `findEnvironmentByLabel`.

### 7. History state

All four clients repeated the same block: load from localStorage after mount,
add an entry, remove an entry, and pick the replacement when the selected entry
was removed. [hooks/use-history.ts](../hooks/use-history.ts) owns this.

### 8. The POST request lifecycle

Three clients repeated the loading flag, the `fetch` call, the `!res.ok` branch,
the network catch, and the `finally` reset.
[hooks/use-json-request.ts](../hooks/use-json-request.ts) returns
`{ isLoading, error, setError, send }`.

### 9. Per-environment credentials

Two clients held the same credentials state and the same nested update function.
[hooks/use-environment-credentials.ts](../hooks/use-environment-credentials.ts)
owns the state and exposes `getCredentials`, `updateCredential`, and
`hasCompleteCredentials`. Credentials stay in memory, as before.

### 10. Repeated markup

| New component | Replaces |
| --- | --- |
| `form/DomainField`, `form/PageField`, `form/PortField`, `form/CredentialFields`, `form/FormField` | Ten hand-written field blocks in two clients |
| `form/field-styles.ts` | The same long Tailwind class string on eight inputs and four selects |
| `MarkdownView` | The rendered/raw branch in `OutputPanel`, `MarkdownPanel`, and `PageSidePanel` |
| `InlineAlert` | Four warning and error blocks |
| `LoadingButton` | Four submit buttons with a spinner |
| `EmptyState` | Three placeholder blocks |
| `DiffModeToggle` | Two copies of the exact/smart switch |
| `ComparisonWorkspace` | The sidebar and main layout in all four clients |
| `ToolPageShell` | Four page files, each with its own `TOOLS.find(...)!` lookup |

## Other changes

- Panel results in the two comparison clients now use one `PanelContent` object
  for each side. This replaces six separate state values per client.
- `getTool` in [lib/tools.ts](../lib/tools.ts) throws for an unknown route. The
  old code used a non-null assertion.
- `PageComparisonClient` lost a `pendingSave` ref that nothing read.

## Validation

- `npx vitest run`: 198 tests pass, in 20 files. New tests cover
  `parseDomainInput`, `toPathWithQuery`, `findEnvironmentByLabel`, and the
  helpers in `lib/errors.ts`.
- `npx eslint`: no findings.
- `npx tsc --noEmit`: no new errors. The twelve errors in
  `lib/run-comparison.test.ts` were there before this change.
- `npx next build`: the production build passes.
- Manual check in the browser on all four pages: forms render, history select
  works, and a conversion runs end to end.
