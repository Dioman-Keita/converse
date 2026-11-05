import { Link } from "@tanstack/react-router"

import { useI18n } from "@/shared/i18n"
import { Card, Desk, NotebookCover, buttonVariants } from "@/shared/ui"

export function HomePage() {
  const { t } = useI18n()
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-x-hidden px-4 py-10">
      <Desk />
      <div className="relative z-10">
        <NotebookCover title="Converse" note={t("auth.coverNote")}>
          <Card tilt={3} className="items-center px-6 text-center">
            <h2 className="m-0 font-title text-3xl leading-tight">{t("home.title")}</h2>
            <p className="m-0 text-lg text-ink-soft">{t("home.subtitle")}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <Link to="/login" className={buttonVariants({ size: "lg" })}>
                {t("auth.signIn")} →
              </Link>
              <Link to="/register" className={buttonVariants({ variant: "pink", size: "lg" })}>
                {t("auth.createAccount")}
              </Link>
            </div>
          </Card>
        </NotebookCover>
      </div>
    </main>
  )
}
