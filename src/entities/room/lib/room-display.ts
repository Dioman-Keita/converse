import type { Room } from "../model/types"

/** Group name, or the other person's name for a direct conversation. */
export function roomTitle(room: Room, currentUserId: string): string {
  if (room.type === "group") return room.name
  const other = room.members.find((m) => m.id !== currentUserId)
  return other?.name ?? "Conversation"
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)
  return letters.toUpperCase()
}

/** Most recently active first. */
export function sortRooms(rooms: Room[]): Room[] {
  const activity = (r: Room) => r.lastMessageAt ?? r.createdAt
  return [...rooms].sort((a, b) => activity(b).localeCompare(activity(a)))
}
