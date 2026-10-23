import { roomTitle } from "@/entities/room"
import type { Room } from "@/entities/room"
import { cn } from "@/shared/lib/utils"

import { formatRelative } from "../lib/format"
import { Avatar } from "./avatar"

type RoomListProps = {
  rooms: Room[]
  currentUserId: string
  activeRoomId: string | undefined
  unread: Record<string, number | undefined>
  onSelect: (roomId: string) => void
}

export function RoomList({
  rooms,
  currentUserId,
  activeRoomId,
  unread,
  onSelect,
}: RoomListProps) {
  return (
    <ul className="flex flex-col gap-0.5 p-2">
      {rooms.map((room) => {
        const title = roomTitle(room, currentUserId)
        const count = unread[room.id] ?? 0
        const active = room.id === activeRoomId
        return (
          <li key={room.id}>
            <button
              type="button"
              onClick={() => onSelect(room.id)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
              )}
            >
              <Avatar name={title} seed={room.id} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className={cn("truncate text-sm", count > 0 ? "font-semibold" : "font-medium")}>
                    {title}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {formatRelative(room.lastMessageAt ?? room.createdAt)}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="truncate text-xs text-muted-foreground">
                    {room.type === "group"
                      ? `${room.members.length} members`
                      : room.members.find((m) => m.id !== currentUserId)?.email}
                  </span>
                  {count > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[0.7rem] font-semibold text-primary-foreground">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
