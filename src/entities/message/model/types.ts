import type { UserId } from "@/entities/user"
import type { RoomId } from "@/entities/room"

/**
 * Domain types for chat messages — future Convex `messages` table.
 */
export type MessageId = string

export type Message = {
  id: MessageId
  roomId: RoomId
  authorId: UserId
  body: string
  createdAt: number
}
