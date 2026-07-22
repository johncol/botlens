import { spawn } from "node:child_process";

const port = Number(process.env.PORT ?? 3000);
const baseUrl = `http://127.0.0.1:${port}`;
const smokeTestUrl =
  process.env.SMOKE_TEST_URL ??
  "http://httpbin.org/base64/PG1haW4%2BPGgxPkJvdExlbnMgc21va2UgdGVzdDwvaDE%2BPHA%2BUmVuZGVyZWQgY29udGVudC48L3A%2BPC9tYWluPg%3D%3D";
const crawlerUserAgent =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)";

const server = spawn(process.execPath, ["server.js"], {
  env: process.env,
  stdio: "inherit",
});

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js exited with code ${server.exitCode}`);
    }
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Next.js did not become ready within 30 seconds");
}

try {
  await waitForServer();
  const response = await fetch(`${baseUrl}/api/crawler-compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: smokeTestUrl,
      environment: "production",
      crawlerUserAgent,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      `Crawler comparison returned ${response.status}: ${JSON.stringify(result)}`,
    );
  }
  if (!result.humanMarkdown?.trim() || !result.crawlerMarkdown?.trim()) {
    throw new Error("Crawler comparison returned empty markdown");
  }

  console.log(
    `Vercel parity smoke passed for ${smokeTestUrl} (${result.humanMarkdown.length} human chars, ${result.crawlerMarkdown.length} crawler chars)`,
  );
} finally {
  server.kill("SIGTERM");
}