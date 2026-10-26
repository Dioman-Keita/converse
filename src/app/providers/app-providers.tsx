import type { ReactNode } from "react"

import { I18nProvider } from "@/shared/i18n"

type AppProvidersProps = {
  children: ReactNode
}

/** App-level providers (FSD app layer). */
export function AppProviders({ children }: AppProvidersProps) {
  return <I18nProvider>{children}</I18nProvider>
}
