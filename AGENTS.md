<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:code-quality-rules -->
# Code Quality

- NEVER use `any` — use `unknown`, proper generics, or a named type instead
- ALL TypeScript must compile with zero errors (`npx tsc --noEmit`)
- ALL code must pass ESLint with zero errors or warnings
- Fix root causes — do not suppress errors with `// @ts-ignore` or `eslint-disable`
<!-- END:code-quality-rules -->
