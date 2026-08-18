import type { UserId } from "@/entities/user"

/**
 * Domain types for conversation rooms — future Convex `rooms` table.
 */
export type RoomId = string

export type RoomType = "direct" | "group"

export type Room = {
  id: RoomId
  name: string
  type: RoomType
  memberIds: UserId[]
  lastMessageAt?: number
}
