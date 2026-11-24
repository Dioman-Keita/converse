import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

/**
 * Integration tests against the built server (`.output/`) and a real Postgres.
 * Run with `npm run test:e2e` after `npm run build` — see CONTRIBUTING.md "Tests".
 */
export default defineConfig({
  root: fileURLToPath(new URL("../..", import.meta.url)),
  test: {
    include: ["tests/e2e/**/*.e2e.ts"],
    globalSetup: ["tests/e2e/global-setup.ts"],
    // One shared server process: keep files sequential so timing-sensitive
    // WebSocket assertions don't compete with each other.
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 60_000,
  },
})
