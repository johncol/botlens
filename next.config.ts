import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  output: process.env.VERCEL_PARITY_BUILD ? "standalone" : undefined,
  outputFileTracingIncludes: {
    "/api/crawler-compare": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
      "./node_modules/playwright-core/browsers.json",
    ],
  },
};

export default nextConfig;
