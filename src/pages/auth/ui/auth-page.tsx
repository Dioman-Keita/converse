import type { ReactNode } from "react"

import { LoginForm, RegisterForm } from "@/features/auth"
import type { AuthMode } from "@/features/auth"
import { useI18n } from "@/shared/i18n"

type AuthPageProps = {
  mode: AuthMode
}

/**
 * Auth page composition — FSD pages layer.
 * Routes stay thin; this page picks the right feature form.
 */
export function AuthPage({ mode }: AuthPageProps): ReactNode {
  const { t } = useI18n()
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.35_0.12_280_/_0.35),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,oklch(0.28_0.08_250_/_0.25),transparent_50%)]"
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
        <div className="text-center">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Converse
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.tagline")}
          </p>
        </div>

        {mode === "signin" ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  )
}
