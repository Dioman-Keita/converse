import { Link } from "@tanstack/react-router"
import { ArrowRight, Lock, Mic, Zap } from "lucide-react"
import { motion } from "motion/react"
import type { ReactNode } from "react"

import { useI18n } from "@/shared/i18n"
import { easeOut, fadeUp, stagger, transitions } from "@/shared/lib/motion"
import { gradientFor } from "@/shared/lib/seeded"
import { Backdrop, Logo, TypingDots, buttonVariants } from "@/shared/ui"

/** Landing: headline, two actions, a live-looking conversation preview and three facts. */
export function HomePage() {
  const { t } = useI18n()
  return (
    <div className="relative min-h-svh overflow-x-hidden">
      <Backdrop />

      <header className="relative z-10 mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <Link to="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          {t("auth.signIn")}
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 pt-16 pb-24 text-center sm:px-6 sm:pt-24">
        <Reveal i={0}>
          <span className="inline-flex items-center gap-2 rounded-full border border-hairline-strong bg-gray-50/80 px-3 py-1 font-mono text-xs text-gray-800 backdrop-blur">
            <span className="size-1.5 rounded-full bg-green shadow-[0_0_8px_var(--green)]" />
            {t("home.eyebrow")}
          </span>
        </Reveal>

        <Reveal i={1}>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-balance text-gray-900 sm:text-6xl sm:leading-[1.05]">
            {t("home.title")}
          </h1>
        </Reveal>

        <Reveal i={2}>
          <p className="mx-auto mt-5 max-w-xl text-base text-pretty text-gray-700 sm:text-lg">{t("home.subtitle")}</p>
        </Reveal>

        <Reveal i={3}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register" className={buttonVariants({ size: "lg", className: "group" })}>
              {t("auth.createAccount")}
              <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link to="/login" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              {t("auth.signIn")}
            </Link>
          </div>
        </Reveal>

        <Preview />

        <ul className="mt-20 grid w-full max-w-4xl gap-px overflow-hidden rounded-xl border border-hairline bg-hairline text-left sm:grid-cols-3">
          <Feature i={0} icon={<Zap />} title={t("home.featureRealtime")} text={t("home.featureRealtimeText")} />
          <Feature i={1} icon={<Mic />} title={t("home.featureMedia")} text={t("home.featureMediaText")} />
          <Feature i={2} icon={<Lock />} title={t("home.featurePrivate")} text={t("home.featurePrivateText")} />
        </ul>
      </main>
    </div>
  )
}

function Reveal({ i, children }: { i: number; children: ReactNode }) {
  return (
    <motion.div {...fadeUp} transition={{ ...transitions.slow, delay: 0.1 + i * 0.08 }}>
      {children}
    </motion.div>
  )
}

/** A miniature of the app: three messages land one after another, then someone types. */
function Preview() {
  const { t } = useI18n()
  const messages = [
    { id: "a", who: "Awa", mine: false, text: t("home.previewA") },
    { id: "b", who: "You", mine: true, text: t("home.previewB") },
    { id: "c", who: "Moussa", mine: false, text: t("home.previewC") },
  ]
  return (
    <motion.div
      className="edge-light relative mt-16 w-full max-w-2xl rounded-xl bg-gray-50/90 text-left shadow-lg backdrop-blur"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, ease: easeOut, delay: 0.45 }}
    >
      <div className="flex h-11 items-center gap-2 border-b border-hairline px-4">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-gray-400" />
          <span className="size-2.5 rounded-full bg-gray-400" />
          <span className="size-2.5 rounded-full bg-gray-400" />
        </span>
        <span className="mx-auto font-mono text-xs text-gray-700"># {t("home.previewName")}</span>
        <span className="w-10" />
      </div>
      <div className="flex flex-col gap-3 p-4 sm:p-6">
        {messages.map((m, i) => (
          <motion.div
            key={m.id}
            className={m.mine ? "flex justify-end" : "flex items-end gap-2.5"}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ ...transitions.base, delay: 1 + stagger(i, 0.55) }}
          >
            {!m.mine && (
              <span className="size-7 shrink-0 rounded-full" style={{ background: gradientFor(m.who) }} aria-hidden />
            )}
            <span
              className={
                m.mine
                  ? "max-w-[80%] rounded-2xl rounded-br-md bg-bubble-mine px-3.5 py-2 text-sm text-bubble-mine-fg"
                  : "max-w-[80%] rounded-2xl rounded-bl-md bg-bubble-theirs px-3.5 py-2 text-sm text-bubble-theirs-fg"
              }
            >
              {m.text}
            </span>
          </motion.div>
        ))}
        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8, duration: 0.3 }}
          aria-hidden
        >
          <span className="size-7 shrink-0 rounded-full" style={{ background: gradientFor("Awa") }} />
          <TypingDots />
        </motion.div>
      </div>
    </motion.div>
  )
}

function Feature({ i, icon, title, text }: { i: number; icon: ReactNode; title: string; text: string }) {
  return (
    <motion.li
      className="group bg-gray-0 p-6 transition-colors duration-200 hover:bg-gray-50"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...transitions.slow, delay: stagger(i, 0.1) }}
    >
      <span className="flex size-9 items-center justify-center rounded-lg border border-hairline-strong bg-gray-100 text-gray-900 transition-colors group-hover:border-gray-500 [&_svg]:size-4">
        {icon}
      </span>
      <h2 className="mt-4 mb-1 text-sm font-semibold text-gray-900">{title}</h2>
      <p className="m-0 text-sm text-gray-700">{text}</p>
    </motion.li>
  )
}
