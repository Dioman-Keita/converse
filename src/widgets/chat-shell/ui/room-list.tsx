import { motion } from "motion/react"

import { roomTitle } from "@/entities/room"
import type { Room } from "@/entities/room"
import { useI18n } from "@/shared/i18n"
import { springs } from "@/shared/lib/motion"
import { cn } from "@/shared/lib/utils"

import { useFormatters } from "../lib/format"
import { Avatar } from "./avatar"
import { UnreadSticker } from "./unread-sticker"

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
 * The notebook's index: one handwritten entry per conversation.
 * The open one is swiped with a yellow marker that slides from entry to entry;
 * entries glide to their new place when a conversation becomes the most recent.
 */
export function RoomList({
  rooms,
  currentUserId,
  activeRoomId,
  unread,
  typingByRoom,
  onSelect,
}: RoomListProps) {
  const { t } = useI18n()
  const format = useFormatters()
  return (
    <ul className="flex flex-col gap-0.5 px-3 py-2">
      {rooms.map((room, i) => {
        const title = roomTitle(room, currentUserId)
        const count = unread[room.id] ?? 0
        const active = room.id === activeRoomId
        const other =
          room.type === "direct" ? room.members.find((m) => m.id !== currentUserId) : undefined
        const typing = format.typing(typingByRoom[room.id] ?? [], room.type === "direct")
        return (
          <motion.li
            key={room.id}
            layout="position"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ default: { ...springs.note, delay: Math.min(i, 10) * 0.035 }, layout: springs.nudge }}
          >
            <button
              type="button"
              onClick={() => onSelect(room.id)}
              aria-current={active ? "true" : undefined}
              className="group relative flex w-full items-center gap-3 px-2 py-2 text-left"
            >
              {active && (
                <motion.span
                  layoutId="room-list-highlighter"
                  aria-hidden
                  className="highlighter absolute inset-x-0 inset-y-1"
                  transition={springs.nudge}
                />
              )}
              <span className="relative transition-transform duration-200 group-hover:-rotate-6">
                <Avatar name={title} seed={room.id} online={other?.online} />
              </span>
              <span className="relative min-w-0 flex-1 transition-transform duration-200 group-hover:translate-x-0.5">
                <span className="flex items-baseline gap-2">
                  <span className={cn("truncate font-title text-xl leading-tight", count > 0 && "text-pink-ink")}>
                    {title}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-ink-soft">
                    {format.relative(room.lastMessageAt ?? room.createdAt)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  {typing ? (
                    <span className="truncate text-sm text-pink-ink italic">
                      {room.type === "direct" ? t("typing.short") : typing}
                    </span>
                  ) : (
                    <span className="truncate text-sm text-ink-soft">
                      {room.type === "group"
                        ? t("room.members", { count: room.members.length })
                        : other?.email}
                    </span>
                  )}
                  {count > 0 && <UnreadSticker count={count} />}
                </span>
              </span>
            </button>
          </motion.li>
        )
      })}
    </ul>
  )
}
