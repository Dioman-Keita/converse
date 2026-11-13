import { AnimatePresence, motion } from "motion/react"

import { roomTitle } from "@/entities/room"
import type { Room } from "@/entities/room"
import { useI18n } from "@/shared/i18n"
import { springs, stagger, transitions } from "@/shared/lib/motion"
import { cn } from "@/shared/lib/utils"

import { useFormatters } from "../lib/format"
import { Avatar } from "./avatar"

type RoomListProps = {
  rooms: Room[]
  currentUserId: string
  activeRoomId: string | undefined
  unread: Record<string, number | undefined>
  /** roomId → names of the other people currently typing there. */
  typingByRoom: Record<string, string[] | undefined>
  onSelect: (roomId: string) => void
}

/**
 * One row per conversation. The highlight slides from row to row when the open
 * conversation changes; rows glide to their new place when one becomes the most recent.
 */
export function RoomList({ rooms, currentUserId, activeRoomId, unread, typingByRoom, onSelect }: RoomListProps) {
  const { t } = useI18n()
  const format = useFormatters()
  return (
    <ul className="flex flex-col gap-px px-2 py-1">
      {rooms.map((room, i) => {
        const title = roomTitle(room, currentUserId)
        const count = unread[room.id] ?? 0
        const active = room.id === activeRoomId
        const other = room.type === "direct" ? room.members.find((m) => m.id !== currentUserId) : undefined
        const typing = format.typing(typingByRoom[room.id] ?? [], room.type === "direct")
        return (
          <motion.li
            key={room.id}
            layout="position"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ default: { ...transitions.base, delay: stagger(i) }, layout: springs.layout }}
          >
            <button
              type="button"
              onClick={() => onSelect(room.id)}
              aria-current={active ? "true" : undefined}
              className="group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-gray-100"
            >
              {active && (
                <motion.span
                  layoutId="room-list-active"
                  aria-hidden
                  className="absolute inset-0 rounded-lg border border-hairline-strong bg-gray-200"
                  transition={springs.indicator}
                />
              )}
              <span className="relative">
                <Avatar name={title} seed={other?.id ?? room.id} online={other?.online} />
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "truncate text-sm",
                      count > 0 || active ? "font-semibold text-gray-900" : "font-medium text-gray-900",
                    )}
                  >
                    {title}
                  </span>
                  <span
                    className={cn(
                      "ml-auto shrink-0 font-mono text-[11px] tabular-nums",
                      count > 0 ? "text-blue" : "text-gray-600",
                    )}
                  >
                    {format.relative(room.lastMessageAt ?? room.createdAt)}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center gap-2">
                  {typing ? (
                    <span className="truncate text-[13px] text-blue">
                      {room.type === "direct" ? t("typing.short") : typing}
                    </span>
                  ) : (
                    <span className="truncate text-[13px] text-gray-700">
                      {room.type === "group" ? t("room.members", { count: room.members.length }) : other?.email}
                    </span>
                  )}
                  <AnimatePresence>
                    {count > 0 && (
                      <motion.span
                        key={count > 99 ? "99+" : count}
                        className="ml-auto flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-blue-strong px-1.5 font-mono text-[11px] leading-none font-medium text-white tabular-nums"
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.4, opacity: 0 }}
                        transition={springs.pop}
                      >
                        {count > 99 ? "99+" : count}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </span>
            </button>
          </motion.li>
        )
      })}
    </ul>
  )
}
