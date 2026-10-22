import { eq } from "drizzle-orm"

import { db, schema } from "../db/client"
import { broadcast } from "./hub"
import type { MessageDto } from "./hub"

export const MAX_MESSAGE_LENGTH = 4000

/** Persists a message, bumps the room, and fans it out to live subscribers. */
export async function postMessage(
  roomId: string,
  authorId: string,
  body: string,
  clientId?: string,
): Promise<MessageDto> {
  const message = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(schema.messages)
      .values({ roomId, authorId, body })
      .returning()
    await tx
      .update(schema.rooms)
      .set({ lastMessageAt: row.createdAt })
      .where(eq(schema.rooms.id, roomId))
    return row
  })

  const dto = toMessageDto(message)
  broadcast(roomId, { type: "message", message: dto, clientId })
  return dto
}

export function toMessageDto(row: typeof schema.messages.$inferSelect): MessageDto {
  return {
    id: row.id,
    roomId: row.roomId,
    authorId: row.authorId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  }
}
