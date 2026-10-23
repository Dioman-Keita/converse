import { resolve } from "node:path"
import { definePlugin } from "nitro"

/** Applies pending Drizzle migrations on server start. */
export default definePlugin(async () => {
  if (!process.env.DATABASE_URL) {
    console.warn("[converse] DATABASE_URL not set — skipping migrations")
    return
  }

  const { migrate } = await import("drizzle-orm/postgres-js/migrator")
  const { db } = await import("../db/client")
  try {
    await migrate(db, {
      migrationsFolder: resolve(process.cwd(), "server/db/migrations"),
    })
    console.info("[converse] database migrations applied")
  } catch (error) {
    // Serving without a usable database is pointless: exit so Docker restarts us.
    console.error("[converse] database migrations failed", error)
    process.exit(1)
  }
})
