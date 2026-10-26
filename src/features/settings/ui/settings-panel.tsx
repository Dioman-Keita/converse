import { Check, X } from "lucide-react"
import { useState } from "react"
import type { FormEvent } from "react"

import type { User } from "@/entities/user"
import { LOCALES, LOCALE_NAMES, useI18n } from "@/shared/i18n"
import type { Locale } from "@/shared/i18n"
import { cn } from "@/shared/lib/utils"
import { Button, Input, Label } from "@/shared/ui"

import { updateSettings } from "../api/update-settings"

type SettingsPanelProps = {
  user: User
  onUserChange: (user: User) => void
  onClose: () => void
}

/** Profile settings: display name and interface language. */
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
        <h2 id="settings-title" className="text-base font-semibold tracking-tight">
          {t("settings.title")}
        </h2>
        <Button variant="ghost" size="icon" aria-label={t("settings.close")} onClick={onClose}>
          <X />
        </Button>
      </div>

      <form onSubmit={saveName} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
        <h3 className="text-sm font-medium">{t("settings.profile")}</h3>
        <div className="grid gap-1.5">
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
        <div className="grid gap-1.5">
          <Label htmlFor="settings-email">{t("settings.email")}</Label>
          <Input id="settings-email" value={user.email} readOnly disabled />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={nameState === "saving" || !name.trim() || name.trim() === user.name}
          >
            {nameState === "saving" ? t("settings.saving") : t("settings.save")}
          </Button>
          {nameState === "saved" && (
            <span className="flex items-center gap-1 text-xs text-emerald-500" role="status">
              <Check className="size-3.5" />
              {t("settings.saved")}
            </span>
          )}
        </div>
      </form>

      <fieldset className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
        <legend className="sr-only">{t("settings.language")}</legend>
        <h3 className="text-sm font-medium" aria-hidden>
          {t("settings.language")}
        </h3>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/50 p-1 text-sm" role="radiogroup">
          {LOCALES.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={option === locale}
              lang={option}
              onClick={() => void chooseLocale(option)}
              className={cn(
                "rounded-md px-2 py-1.5 transition-colors",
                option === locale
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {LOCALE_NAMES[option]}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("settings.languageHint")}</p>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}
