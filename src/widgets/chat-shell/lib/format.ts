// UI is in French: dates follow it rather than the browser language.
const LOCALE = "fr-FR"

const time = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" })
const weekday = new Intl.DateTimeFormat(LOCALE, { weekday: "short" })
const date = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short" })
const longDate = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
})

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

const DAY = 86_400_000

export function formatTime(iso: string): string {
  return time.format(new Date(iso))
}

/** Compact timestamp for the room list: time today, weekday this week, date otherwise. */
export function formatRelative(iso: string): string {
  const d = new Date(iso)
  const days = (startOfDay(new Date()) - startOfDay(d)) / DAY
  if (days < 1) return time.format(d)
  if (days < 7) return weekday.format(d)
  return date.format(d)
}

export function formatDay(iso: string): string {
  const d = new Date(iso)
  const days = (startOfDay(new Date()) - startOfDay(d)) / DAY
  if (days < 1) return "Aujourd’hui"
  if (days < 2) return "Hier"
  return longDate.format(d)
}

export function isSameDay(a: string, b: string): boolean {
  return startOfDay(new Date(a)) === startOfDay(new Date(b))
}
