import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": resolve(__dirname, "lib/__mocks__/server-only.ts"),
      "@": resolve(__dirname, "."),
    },
  },
});
