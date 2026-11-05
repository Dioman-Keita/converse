import { X } from "lucide-react"
import { motion } from "motion/react"
import { useState } from "react"
import type { FormEvent } from "react"

import type { User } from "@/entities/user"
import { LOCALES, LOCALE_NAMES, useI18n } from "@/shared/i18n"
import type { Locale } from "@/shared/i18n"
import { Button, Card, Input, Label, StickerChoice, TornLabel } from "@/shared/ui"

import { updateSettings } from "../api/update-settings"

type SettingsPanelProps = {
  user: User
  onUserChange: (user: User) => void
  onClose: () => void
}

/** Profile settings: display name and interface language, on two taped scraps. */
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
    <section aria-labelledby="settings-title" className="flex flex-col gap-7">
      <div className="flex items-center justify-between">
        <TornLabel tilt={-2} paperClassName="px-5 pt-1.5 pb-2">
          <h2 id="settings-title" className="m-0 font-title text-2xl font-normal">
            {t("settings.title")}
          </h2>
        </TornLabel>
        <Button variant="ghost" size="icon" aria-label={t("settings.close")} onClick={onClose}>
          <X />
        </Button>
      </div>

      <Card tilt={-0.8} size="sm" className="px-1">
        <form onSubmit={saveName} className="flex flex-col gap-3 px-(--card-spacing)">
          <h3 className="m-0 font-title text-xl font-normal">{t("settings.profile")}</h3>
          <div className="grid gap-1">
            <Label htmlFor="settings-name">{t("settings.displayName")}</Label>
            <Input
              id="settings-name"
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
          <div className="grid gap-1">
            <Label htmlFor="settings-email">{t("settings.email")}</Label>
            <Input id="settings-email" value={user.email} readOnly disabled />
          </div>
          <div className="flex min-h-10 items-center gap-3">
            <Button
              type="submit"
              size="sm"
              disabled={nameState === "saving" || !name.trim() || name.trim() === user.name}
            >
              {nameState === "saving" ? t("settings.saving") : t("settings.save")}
            </Button>
            {nameState === "saved" && (
              <motion.span
                className="text-base text-ink-soft"
                role="status"
                initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
                animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                {t("settings.saved")} ✓
              </motion.span>
            )}
          </div>
        </form>
      </Card>

      <Card tilt={0.8} size="sm" className="px-1">
        <fieldset className="m-0 flex flex-col gap-3 border-0 p-0 px-(--card-spacing)">
          <legend className="sr-only">{t("settings.language")}</legend>
          <h3 className="m-0 font-title text-xl font-normal" aria-hidden>
            {t("settings.language")}
          </h3>
          <StickerChoice
            name="locale"
            label={t("settings.language")}
            options={LOCALES.map((option) => ({ value: option, label: LOCALE_NAMES[option], lang: option }))}
            value={locale}
            onChange={(next) => void chooseLocale(next)}
          />
          <p className="m-0 text-sm text-ink-soft">{t("settings.languageHint")}</p>
        </fieldset>
      </Card>

      {error && (
        <p role="alert" className="m-0 text-base text-error-ink">
          ✗ {error}
        </p>
      )}
    </section>
  )
}
