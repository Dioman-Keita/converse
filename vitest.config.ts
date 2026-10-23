import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

/**
 * Unit tests (`npm run test`): plain Vitest, without the app's Vite plugins
 * (Nitro and TanStack Start can't run inside Vitest).
 * Integration tests have their own config: tests/e2e/vitest.config.ts.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
