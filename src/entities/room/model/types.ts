import type { UserId } from "@/entities/user"

/**
 * Domain types for conversation rooms — Postgres `rooms` table (server/db/schema.ts).
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
