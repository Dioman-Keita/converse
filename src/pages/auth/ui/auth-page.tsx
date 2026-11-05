import type { ReactNode } from "react"

import { LoginForm, RegisterForm } from "@/features/auth"
import type { AuthMode } from "@/features/auth"
import { useI18n } from "@/shared/i18n"
import { Desk, NotebookCover } from "@/shared/ui"

type AuthPageProps = {
  mode: AuthMode
}

/**
 * Auth page composition — FSD pages layer.
 * The closed notebook on the desk; the form is a scrap of paper taped on its cover.
 */
export function AuthPage({ mode }: AuthPageProps): ReactNode {
  const { t } = useI18n()
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-x-hidden px-4 py-10">
      <Desk />
      <div className="relative z-10">
        <NotebookCover title="Converse" note={t("auth.coverNote")}>
          {mode === "signin" ? <LoginForm /> : <RegisterForm />}
        </NotebookCover>
        <p className="mt-6 text-center font-title text-lg tracking-wide text-paper-light/55">
          {t("auth.tagline")}
        </p>
      </div>
    </div>
  )
}
