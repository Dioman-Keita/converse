import { useEffect, useState } from "react"

import type { RoomMember } from "@/entities/room"

const LOCALE = "fr-FR"
const time = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" })
const weekday = new Intl.DateTimeFormat(LOCALE, { weekday: "long" })
const date = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short" })

const MINUTE = 60_000
const DAY = 86_400_000

function startOfDay(ms: number): number {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/**
 * "En ligne", "En ligne il y a 5 min", "En ligne hier à 14:32", …
 * `now` is passed in so the caller controls how often relative times refresh.
 */
export function formatPresence(member: Pick<RoomMember, "online" | "lastSeenAt">, now: number): string {
  if (member.online) return "En ligne"
  if (!member.lastSeenAt) return "Hors ligne"

  const seen = new Date(member.lastSeenAt).getTime()
  const elapsed = Math.max(0, now - seen)
  if (elapsed < MINUTE) return "En ligne à l’instant"
  if (elapsed < 60 * MINUTE) return `En ligne il y a ${Math.floor(elapsed / MINUTE)} min`

  const days = Math.round((startOfDay(now) - startOfDay(seen)) / DAY)
  const at = time.format(seen)
  if (days === 0) return `En ligne il y a ${Math.floor(elapsed / (60 * MINUTE))} h`
  if (days === 1) return `En ligne hier à ${at}`
  if (days < 7) return `En ligne ${weekday.format(seen)} à ${at}`
  return `En ligne le ${date.format(seen)}`
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

/** Typing line for a conversation header or list row; `undefined` when nobody types. */
export function formatTyping(names: string[], direct: boolean): string | undefined {
  if (names.length === 0) return undefined
  if (direct) return "est en train d’écrire…"
  if (names.length === 1) return `${firstName(names[0])} est en train d’écrire…`
  if (names.length === 2) return `${firstName(names[0])} et ${firstName(names[1])} écrivent…`
  return "Plusieurs personnes écrivent…"
}

/** Current time, refreshed every `intervalMs` so relative labels stay accurate. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}
