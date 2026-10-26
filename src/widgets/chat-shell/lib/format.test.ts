import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { translate } from "@/shared/i18n"
import type { Locale } from "@/shared/i18n"

import { createFormatters } from "./format"

const formatters = (locale: Locale) =>
  createFormatters(locale === "en" ? "en-US" : "fr-FR", (key, params) =>
    translate(locale, key, params),
  )

// Wednesday 2026-10-21, 15:00 local time.
const NOW = new Date(2026, 9, 21, 15, 0).getTime()
const ago = (ms: number) => new Date(NOW - ms).toISOString()
const MIN = 60_000

describe("presence labels", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it.each([
    ["en", { online: true, lastSeenAt: null }, "Online"],
    ["fr", { online: true, lastSeenAt: null }, "En ligne"],
    ["en", { online: false, lastSeenAt: null }, "Offline"],
    ["fr", { online: false, lastSeenAt: null }, "Hors ligne"],
    ["en", { online: false, lastSeenAt: ago(20_000) }, "Online just now"],
    ["fr", { online: false, lastSeenAt: ago(5 * MIN) }, "En ligne il y a 5 min"],
    ["en", { online: false, lastSeenAt: ago(5 * MIN) }, "Online 5 min ago"],
    ["en", { online: false, lastSeenAt: ago(3 * 60 * MIN) }, "Online 3 h ago"],
  ] as const)("%s: %o → %s", (locale, member, expected) => {
    expect(formatters(locale).presence(member, NOW)).toBe(expected)
  })

  it("names yesterday and weekdays in the right language", () => {
    const yesterday = new Date(2026, 9, 20, 9, 30).toISOString()
    expect(formatters("fr").presence({ online: false, lastSeenAt: yesterday }, NOW)).toBe(
      "En ligne hier à 09:30",
    )
    expect(formatters("en").presence({ online: false, lastSeenAt: yesterday }, NOW)).toMatch(
      /^Online yesterday at 09:30 AM$/,
    )
    const monday = new Date(2026, 9, 19, 9, 30).toISOString()
    expect(formatters("fr").presence({ online: false, lastSeenAt: monday }, NOW)).toBe(
      "En ligne lundi à 09:30",
    )
    expect(formatters("en").presence({ online: false, lastSeenAt: monday }, NOW)).toMatch(
      /^Online Monday at 09:30 AM$/,
    )
  })
})

describe("typing and day labels", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  it("builds typing lines", () => {
    const en = formatters("en")
    const fr = formatters("fr")
    expect(en.typing([], false)).toBeUndefined()
    expect(en.typing(["Bob Martin"], true)).toBe("is typing…")
    expect(fr.typing(["Bob Martin"], false)).toBe("Bob est en train d’écrire…")
    expect(en.typing(["Awa Traoré", "Bob Martin"], false)).toBe("Awa and Bob are typing…")
    expect(fr.typing(["a", "b", "c"], false)).toBe("Plusieurs personnes écrivent…")
  })

  it("labels today and yesterday", () => {
    expect(formatters("en").day(new Date(NOW).toISOString())).toBe("Today")
    expect(formatters("fr").day(new Date(2026, 9, 20, 12).toISOString())).toBe("Hier")
  })
})
