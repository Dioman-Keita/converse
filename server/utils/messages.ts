import { eq } from "drizzle-orm"

import { db, schema } from "../db/client"
import { broadcast } from "./hub"
import type { MessageDto } from "./hub"

export const MAX_MESSAGE_LENGTH = 4000

type MessageRow = typeof schema.messages.$inferSelect

export type NewMessage =
  | { kind: "text"; body: string }
  | { kind: "voice"; mediaPath: string; mediaDurationMs: number }
  | { kind: "image"; mediaPath: string; mediaWidth: number; mediaHeight: number }
  /** Stored right away; the converted file is attached later (see utils/videos.ts). */
  | { kind: "video"; mediaDurationMs: number }

function rowValues(roomId: string, authorId: string, content: NewMessage) {
  const base = { roomId, authorId, kind: content.kind, body: "" }
  switch (content.kind) {
    case "text":
      return { ...base, body: content.body }
    case "voice":
      return { ...base, mediaPath: content.mediaPath, mediaDurationMs: content.mediaDurationMs, mediaStatus: "ready" as const }
    case "image":
      return {
        ...base,
        mediaPath: content.mediaPath,
        mediaWidth: content.mediaWidth,
        mediaHeight: content.mediaHeight,
        mediaStatus: "ready" as const,
      }
    case "video":
      return { ...base, mediaDurationMs: content.mediaDurationMs, mediaStatus: "processing" as const }
  }
}

/** Persists a message, bumps the room, and fans it out to live subscribers. */
export async function postMessage(
  roomId: string,
  authorId: string,
  content: NewMessage,
  clientId?: string,
): Promise<MessageDto> {
  const message = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(schema.messages)
      .values(rowValues(roomId, authorId, content))
      .returning()
    await tx
      .update(schema.rooms)
      .set({ lastMessageAt: row.createdAt })
      .where(eq(schema.rooms.id, roomId))
    return row
  })

  return publishMessage(message, clientId)
}

/** Broadcasts a message (new, or updated such as a video that finished converting). */
export function publishMessage(row: MessageRow, clientId?: string): MessageDto {
  const dto = toMessageDto(row)
  broadcast(row.roomId, { type: "message", message: dto, clientId })
  return dto
}

export function toMessageDto(row: MessageRow): MessageDto {
  const url = `/api/media/${row.id}`
  return {
    id: row.id,
    roomId: row.roomId,
    authorId: row.authorId,
    kind: row.kind,
    body: row.body,
    ...(row.kind === "voice" && {
      voice: { url, durationMs: row.mediaDurationMs ?? 0 },
    }),
    ...(row.kind === "image" && {
      image: { url, width: row.mediaWidth ?? 0, height: row.mediaHeight ?? 0 },
    }),
    ...(row.kind === "video" && {
      video:
        row.mediaStatus === "ready"
          ? {
              status: "ready" as const,
              url,
              posterUrl: `${url}/poster`,
              width: row.mediaWidth ?? 0,
              height: row.mediaHeight ?? 0,
              durationMs: row.mediaDurationMs ?? 0,
            }
          : { status: row.mediaStatus === "failed" ? ("failed" as const) : ("processing" as const) },
    }),
    createdAt: row.createdAt.toISOString(),
  }
}
