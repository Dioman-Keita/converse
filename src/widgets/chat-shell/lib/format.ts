import { useMemo } from "react"

import type { RoomMember } from "@/entities/room"
import { useI18n } from "@/shared/i18n"
import type { Translate } from "@/shared/i18n"

const MINUTE = 60_000
const DAY = 86_400_000

function startOfDay(input: Date | number): number {
  const d = new Date(input)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function isSameDay(a: string, b: string): boolean {
  return startOfDay(new Date(a)) === startOfDay(new Date(b))
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

/** Date, presence and typing labels in the interface language. */
export function createFormatters(intlLocale: string, t: Translate) {
  const time = new Intl.DateTimeFormat(intlLocale, { hour: "2-digit", minute: "2-digit" })
  const shortWeekday = new Intl.DateTimeFormat(intlLocale, { weekday: "short" })
  const longWeekday = new Intl.DateTimeFormat(intlLocale, { weekday: "long" })
  const shortDate = new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "short" })
  const longDate = new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return {
    time: (iso: string) => time.format(new Date(iso)),

    /** Compact timestamp for the room list: time today, weekday this week, date otherwise. */
    relative: (iso: string) => {
      const d = new Date(iso)
      const days = (startOfDay(Date.now()) - startOfDay(d)) / DAY
      if (days < 1) return time.format(d)
      if (days < 7) return shortWeekday.format(d)
      return shortDate.format(d)
    },

    /** Day separator in a conversation. */
    day: (iso: string) => {
      const d = new Date(iso)
      const days = (startOfDay(Date.now()) - startOfDay(d)) / DAY
      if (days < 1) return t("date.today")
      if (days < 2) return t("date.yesterday")
      return longDate.format(d)
    },

    /**
     * "Online", "Online 5 min ago", "Online yesterday at 2:32 PM", …
     * `now` is passed in so the caller controls how often relative times refresh.
     */
    presence: (member: Pick<RoomMember, "online" | "lastSeenAt">, now: number) => {
      if (member.online) return t("presence.online")
      if (!member.lastSeenAt) return t("presence.offline")

      const seen = new Date(member.lastSeenAt).getTime()
      const elapsed = Math.max(0, now - seen)
      if (elapsed < MINUTE) return t("presence.justNow")
      if (elapsed < 60 * MINUTE) return t("presence.minutes", { n: Math.floor(elapsed / MINUTE) })

      const days = Math.round((startOfDay(now) - startOfDay(seen)) / DAY)
      const at = time.format(seen)
      if (days === 0) return t("presence.hours", { n: Math.floor(elapsed / (60 * MINUTE)) })
      if (days === 1) return t("presence.yesterday", { time: at })
      if (days < 7) return t("presence.weekday", { weekday: longWeekday.format(seen), time: at })
      return t("presence.date", { date: shortDate.format(seen) })
    },

    /** Typing line for a header or the thread; `undefined` when nobody types. */
    typing: (names: string[], direct: boolean) => {
      if (names.length === 0) return undefined
      if (direct) return t("typing.direct")
      if (names.length === 1) return t("typing.one", { name: firstName(names[0]) })
      if (names.length === 2) {
        return t("typing.two", { a: firstName(names[0]), b: firstName(names[1]) })
      }
      return t("typing.many")
    },
  }
}

export type Formatters = ReturnType<typeof createFormatters>

export function useFormatters(): Formatters {
  const { intlLocale, t } = useI18n()
  return useMemo(() => createFormatters(intlLocale, t), [intlLocale, t])
}
