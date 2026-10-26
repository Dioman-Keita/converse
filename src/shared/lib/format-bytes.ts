import type { Translate } from "@/shared/i18n"

const UNITS = ["bytes.b", "bytes.kb", "bytes.mb", "bytes.gb"] as const

/** "840 B", "12 KB", "2.4 MB" — "2,4 Mo" in French (unit names and decimals localized). */
export function formatBytes(bytes: number, intlLocale: string, t: Translate): string {
  let value = Math.max(0, bytes)
  let unit = 0
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024
    unit++
  }
  const n = new Intl.NumberFormat(intlLocale, {
    maximumFractionDigits: unit === 0 || value >= 10 ? 0 : 1,
  }).format(value)
  return t(UNITS[unit], { n })
}
