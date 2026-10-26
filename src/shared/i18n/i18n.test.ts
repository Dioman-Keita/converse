import { describe, expect, it } from "vitest"

import { en, fr } from "./dictionaries"
import { translate } from "./i18n"

describe("dictionaries", () => {
  it("define the same keys in every language", () => {
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort())
  })

  it("use the same placeholders in every language", () => {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(placeholders(fr[key]), key).toEqual(placeholders(en[key]))
    }
  })

  it("have no empty strings", () => {
    for (const [key, value] of [...Object.entries(en), ...Object.entries(fr)]) {
      expect(value.trim(), key).not.toBe("")
    }
  })
})

describe("translate", () => {
  it("fills placeholders", () => {
    expect(translate("en", "room.membersOnline", { count: 3, online: 2 })).toBe(
      "3 members · 2 online",
    )
    expect(translate("fr", "room.membersOnline", { count: 3, online: 2 })).toBe(
      "3 membres · 2 en ligne",
    )
  })

  it("leaves unknown placeholders visible instead of crashing", () => {
    expect(translate("en", "typing.one")).toBe("{name} is typing…")
  })
})
