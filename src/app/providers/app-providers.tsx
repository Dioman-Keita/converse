import type { ReactNode } from "react"

type AppProvidersProps = {
  children: ReactNode
}

/**
 * App-level providers (FSD app layer).
 * Mount point for the future realtime (/ws) connection provider.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return children
}
