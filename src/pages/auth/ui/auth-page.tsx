import { Link } from "@tanstack/react-router"
import { motion } from "motion/react"
import type { ReactNode } from "react"

import { LoginForm, RegisterForm } from "@/features/auth"
import type { AuthMode } from "@/features/auth"
import { useI18n } from "@/shared/i18n"
import { easeOut } from "@/shared/lib/motion"
import { Backdrop, Logo } from "@/shared/ui"

type AuthPageProps = {
  mode: AuthMode
}

/**
 * Auth page composition — FSD pages layer.
 * The form sits alone in the middle of the grid, under the light from the top edge.
 */
export function AuthPage({ mode }: AuthPageProps): ReactNode {
  const { t } = useI18n()
  return (
    <div className="relative flex min-h-svh w-full flex-col overflow-x-hidden">
      <Backdrop />
      <header className="relative z-10 flex h-16 items-center px-4 sm:px-6">
        <Link to="/" aria-label={t("auth.backHome")} className="rounded-md">
          <Logo />
        </Link>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <motion.div
          key={mode}
          className="w-full max-w-[400px]"
          initial={{ opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          {mode === "signin" ? <LoginForm /> : <RegisterForm />}
          <p className="mt-6 text-center font-mono text-xs text-gray-600">{t("auth.tagline")}</p>
        </motion.div>
      </main>
    </div>
  )
}
