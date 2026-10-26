import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

import { en, fr } from "./dictionaries"
import type { MessageKey } from "./dictionaries"

export const LOCALES = ["en", "fr"] as const
export type Locale = (typeof LOCALES)[number]

/** Endonyms, shown as-is in the language picker whatever the current language. */
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", fr: "Français" }

/** BCP 47 tags for Intl date/time formatting. */
const INTL_LOCALES: Record<Locale, string> = { en: "en-US", fr: "fr-FR" }

const DICTIONARIES = { en, fr } satisfies Record<Locale, Record<MessageKey, string>>
const STORAGE_KEY = "converse.locale"
export const DEFAULT_LOCALE: Locale = "en"

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale)
}

export type Translate = (key: MessageKey, params?: Record<string, string | number>) => string

export function translate(
  locale: Locale,
  key: MessageKey,
  params: Record<string, string | number> = {},
): string {
  return DICTIONARIES[locale][key].replace(/\{(\w+)\}/g, (_, name: string) =>
    String(params[name] ?? `{${name}}`),
  )
}

// Current language for non-React code (the API client sends it as Accept-Language).
let current: Locale = DEFAULT_LOCALE
export function currentLocale(): Locale {
  return current
}

function readStoredLocale(): Locale | undefined {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isLocale(stored) ? stored : undefined
  } catch {
    return undefined
  }
}

type I18nValue = {
  locale: Locale
  /** Tag for Intl.DateTimeFormat & co. */
  intlLocale: string
  t: Translate
  /** Switches the interface language (remembered on this device). */
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nValue | null>(null)

/**
 * Interface language. English by default; the signed-in user's saved choice wins
 * (applied by the chat page), and the last choice is remembered on the device so
 * the sign-in pages already use it.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  // Server render and first client render both use the default, so hydration
  // matches; the remembered language is applied right after mount.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    const stored = readStoredLocale()
    if (stored) setLocaleState(stored)
  }, [])

  useEffect(() => {
    current = locale
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    current = next
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private mode or storage disabled: the choice still applies for this session.
    }
  }, [])

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      intlLocale: INTL_LOCALES[locale],
      t: (key, params) => translate(locale, key, params),
      setLocale,
    }),
    [locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>")
  return value
}
