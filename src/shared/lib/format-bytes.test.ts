import { describe, expect, it } from "vitest"

import { translate } from "@/shared/i18n"

import { formatBytes } from "./format-bytes"

const en = (bytes: number) => formatBytes(bytes, "en-US", (key, params) => translate("en", key, params))
const fr = (bytes: number) => formatBytes(bytes, "fr-FR", (key, params) => translate("fr", key, params))

describe("formatBytes", () => {
  it("picks a readable unit", () => {
    expect(en(0)).toBe("0 B")
    expect(en(840)).toBe("840 B")
    expect(en(12 * 1024)).toBe("12 KB")
    expect(en(2.4 * 1024 * 1024)).toBe("2.4 MB")
    expect(en(95 * 1024 * 1024)).toBe("95 MB")
    expect(en(3 * 1024 ** 3)).toBe("3 GB")
  })

  it("uses French units and decimal comma", () => {
    expect(fr(840)).toBe("840 o")
    expect(fr(2.4 * 1024 * 1024)).toBe("2,4 Mo")
  })
})
