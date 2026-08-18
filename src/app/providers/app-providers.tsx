import type { ReactNode } from "react"

import { getConvexClientStatus } from "@/shared/api"

type AppProvidersProps = {
  children: ReactNode
}

/**
 * App-level providers (FSD app layer).
 *
 * When Convex is configured:
 * ```tsx
 * import { ConvexProvider } from "convex/react"
 * import { convex } from "@/shared/api"
 * return <ConvexProvider client={convex}>{children}</ConvexProvider>
 * ```
 */
export function AppProviders({ children }: AppProvidersProps) {
  // Gate for future ConvexProvider mount — keeps tree pure until configured.
  void getConvexClientStatus()
  return children
}
