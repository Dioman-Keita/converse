import { Check, CircleAlert, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import type { FormEvent, ReactNode } from "react"

import type { User } from "@/entities/user"
import { LOCALES, LOCALE_NAMES, useI18n } from "@/shared/i18n"
import type { Locale } from "@/shared/i18n"
import { springs, stagger, transitions } from "@/shared/lib/motion"
import { Button, Input, Label, Segmented, Spinner } from "@/shared/ui"

import { updateSettings } from "../api/update-settings"

type SettingsPanelProps = {
  user: User
  onUserChange: (user: User) => void
  onClose: () => void
}

/** Profile settings: display name and interface language, as two bordered sections. */
export function SettingsPanel({ user, onUserChange, onClose }: SettingsPanelProps) {
  const { t, locale, setLocale } = useI18n()
  const [name, setName] = useState(user.name)
  const [nameState, setNameState] = useState<"idle" | "saving" | "saved">("idle")
  const [error, setError] = useState<string>()

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed === user.name) return
    setError(undefined)
    setNameState("saving")
    try {
      onUserChange(await updateSettings({ name: trimmed }))
      setNameState("saved")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.failed"))
      setNameState("idle")
    }
  }

  async function chooseLocale(next: Locale) {
    if (next === locale) return
    const previous = locale
    // Switch right away; the account remembers it for the user's other devices.
    setLocale(next)
    setError(undefined)
    try {
      onUserChange(await updateSettings({ locale: next }))
    } catch (err) {
      setLocale(previous)
      setError(err instanceof Error ? err.message : t("settings.failed"))
    }
  }

  return (
    <section aria-labelledby="settings-title" className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 id="settings-title" className="m-0 text-base font-semibold tracking-[-0.01em] text-gray-900">
          {t("settings.title")}
        </h2>
        <Button variant="ghost" size="icon-sm" aria-label={t("settings.close")} onClick={onClose}>
          <X />
        </Button>
      </div>

      <Section i={0} title={t("settings.profile")}>
        <form onSubmit={saveName} className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="settings-name">{t("settings.displayName")}</Label>
            <Input
              id="settings-name"
              className="h-9"
              value={name}
              maxLength={80}
              autoComplete="name"
              onChange={(e) => {
                setName(e.target.value)
                setNameState("idle")
              }}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="settings-email">{t("settings.email")}</Label>
            <Input id="settings-email" className="h-9 font-mono text-[13px]" value={user.email} readOnly disabled />
          </div>
          <div className="flex min-h-8 items-center justify-end gap-3">
            <AnimatePresence>
              {nameState === "saved" && (
                <motion.span
                  className="flex items-center gap-1.5 text-[13px] text-green"
                  role="status"
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={transitions.base}
                >
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={springs.pop}>
                    <Check className="size-3.5" aria-hidden />
                  </motion.span>
                  {t("settings.saved")}
                </motion.span>
              )}
            </AnimatePresence>
            <Button
              type="submit"
              size="sm"
              disabled={nameState === "saving" || !name.trim() || name.trim() === user.name}
            >
              {nameState === "saving" && <Spinner className="size-3.5" />}
              {nameState === "saving" ? t("settings.saving") : t("settings.save")}
            </Button>
          </div>
        </form>
      </Section>

      <Section i={1} title={t("settings.language")} hint={t("settings.languageHint")}>
        <Segmented
          name="locale"
          label={t("settings.language")}
          options={LOCALES.map((option) => ({ value: option, label: LOCALE_NAMES[option], lang: option }))}
          value={locale}
          onChange={(next) => void chooseLocale(next)}
        />
      </Section>

      {error && (
        <p role="alert" className="m-0 flex items-start gap-2 text-[13px] text-red">
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </section>
  )
}

function Section({ i, title, hint, children }: { i: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <motion.div
      className="overflow-hidden rounded-xl border border-hairline bg-gray-0"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitions.base, delay: stagger(i, 0.06) }}
    >
      <div className="border-b border-hairline px-4 py-3">
        <h3 className="m-0 text-sm font-semibold text-gray-900">{title}</h3>
        {hint && <p className="m-0 mt-0.5 text-xs text-gray-700">{hint}</p>}
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  )
}
