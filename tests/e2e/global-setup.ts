/**
 * Starts the built server (`node .output/server/index.mjs`) once for the whole run.
 * Migrations run at startup, so an empty database is enough.
 *
 * Env:
 * - E2E_DATABASE_URL: dedicated test database (never the real one) —
 *   default postgres://converse:converse@127.0.0.1:55432/converse_test
 * - E2E_PORT: port of the test server (default 3123, away from the app's 3000)
 */
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { once } from "node:events"
import type { TestProject } from "vitest/node"

const SERVER_ENTRY = ".output/server/index.mjs"

export default async function setup(project: TestProject) {
  if (!existsSync(SERVER_ENTRY)) {
    throw new Error(`${SERVER_ENTRY} is missing: run \`npm run build\` first`)
  }

  const databaseUrl =
    process.env.E2E_DATABASE_URL ??
    "postgres://converse:converse@127.0.0.1:55432/converse_test"
  const port = Number(process.env.E2E_PORT ?? 3123)
  const baseUrl = `http://127.0.0.1:${port}`

  const server = spawn(process.execPath, [SERVER_ENTRY], {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      HOST: "127.0.0.1",
      PORT: String(port),
      NODE_ENV: "production",
    },
    stdio: ["ignore", "pipe", "pipe"],
  })
  let log = ""
  server.stdout.on("data", (chunk: Buffer) => (log += chunk.toString()))
  server.stderr.on("data", (chunk: Buffer) => (log += chunk.toString()))
  const exited = () => server.exitCode !== null || server.signalCode !== null

  const deadline = Date.now() + 45_000
  for (;;) {
    if (exited()) throw new Error(`Test server exited during startup:\n${log}`)
    if (Date.now() > deadline) {
      server.kill()
      throw new Error(`Test server did not start on ${baseUrl}:\n${log}`)
    }
    // Ready = listening (401 without auth) and migrations applied (logged by server/plugins/migrate.ts).
    if (log.includes("migrations applied")) {
      try {
        const res = await fetch(`${baseUrl}/api/auth/me`)
        if (res.status === 401) break
      } catch {
        // Not listening yet.
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  project.provide("baseUrl", baseUrl)
  project.provide("databaseUrl", databaseUrl)

  return async () => {
    if (exited()) return
    server.kill()
    await once(server, "exit")
    if (process.env.E2E_SERVER_LOG) console.info(log)
  }
}

declare module "vitest" {
  export interface ProvidedContext {
    baseUrl: string
    databaseUrl: string
  }
}
