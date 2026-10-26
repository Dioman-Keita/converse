import type { MessageDto } from "@/shared/api"

/**
 * Domain types for chat messages — Postgres `messages` table (server/db/schema.ts).
 */
export type MessageId = string

export type Message = MessageDto

/**
 * A message as shown in the UI: confirmed by the server, or still local
 * (optimistic) until its echo arrives with the same `clientId`.
 */
export type ChatMessage = Message & {
  clientId?: string
  status: "sent" | "pending" | "failed"
  /** Photo/video still uploading: progress (0–1) and an in-memory preview. */
  upload?: { progress: number; localUrl: string }
}
