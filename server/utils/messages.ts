import { eq } from "drizzle-orm"

import { db, schema } from "../db/client"
import { broadcast } from "./hub"
import type { MessageDto } from "./hub"

export const MAX_MESSAGE_LENGTH = 4000

type NewMessage =
  | { kind: "text"; body: string }
  | { kind: "voice"; mediaPath: string; mediaDurationMs: number }

/** Persists a message, bumps the room, and fans it out to live subscribers. */
export async function postMessage(
  roomId: string,
  authorId: string,
  content: NewMessage,
  clientId?: string,
): Promise<MessageDto> {
  const values =
    content.kind === "text"
      ? { roomId, authorId, kind: "text" as const, body: content.body }
      : {
          roomId,
          authorId,
          kind: "voice" as const,
          body: "",
          mediaPath: content.mediaPath,
          mediaDurationMs: content.mediaDurationMs,
        }

  const message = await db.transaction(async (tx) => {
    const [row] = await tx.insert(schema.messages).values(values).returning()
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
    kind: row.kind,
    body: row.body,
    ...(row.kind === "voice" && {
      voice: { url: `/api/media/${row.id}`, durationMs: row.mediaDurationMs ?? 0 },
    }),
    createdAt: row.createdAt.toISOString(),
  }
}
