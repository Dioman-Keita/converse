/**
 * Convex client scaffold — ready for realtime chat & call.
 *
 * When integrating:
 * 1. `bun add convex`
 * 2. `bunx convex dev` (generates `convex/_generated`)
 * 3. Set `VITE_CONVEX_URL` in `.env.local`
 * 4. Replace this stub with:
 *    `import { ConvexReactClient } from "convex/react"`
 *    `export const convex = new ConvexReactClient(env.convexUrl!)`
 *
 * FSD placement:
 * - Client instance lives in `shared/api` (infra, no business rules)
 * - Queries/mutations wrappers live in `entities/*\/api` or `features/*\/api`
 * - `useQuery` / `useMutation` consumers stay in features/widgets
 */
import { env } from "@/shared/config/env"

export type ConvexClientStatus = "unconfigured" | "ready"

export function getConvexClientStatus(): ConvexClientStatus {
  return env.isConvexConfigured ? "ready" : "unconfigured"
}

/**
 * Placeholder until `convex` is installed.
 * Call sites should gate on `getConvexClientStatus() === "ready"`.
 */
export const convexClient = null
