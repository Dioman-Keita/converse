import { MotionConfig } from "motion/react"
import type { ReactNode } from "react"

import { I18nProvider } from "@/shared/i18n"
import { ScrapbookFilters } from "@/shared/ui"

type AppProvidersProps = {
  children: ReactNode
}

/**
 * App-level providers (FSD app layer).
 * Motion follows the system's "reduce motion" setting everywhere.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <I18nProvider>
      <MotionConfig reducedMotion="user">
        <ScrapbookFilters />
        {children}
      </MotionConfig>
    </I18nProvider>
  )
}
