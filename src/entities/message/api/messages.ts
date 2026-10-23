import { api } from "@/shared/api"

import type { Message } from "../model/types"

export type MessagePage = { messages: Message[]; nextCursor: string | null }

/** One page of history, newest first. */
export function fetchMessages(roomId: string, before?: string): Promise<MessagePage> {
  const query = before ? `?before=${encodeURIComponent(before)}` : ""
  return api<MessagePage>(`/api/rooms/${roomId}/messages${query}`)
}

export async function postMessage(
  roomId: string,
  body: string,
  clientId: string,
): Promise<Message> {
  const { message } = await api<{ message: Message }>(
    `/api/rooms/${roomId}/messages`,
    { json: { body, clientId } },
  )
  return message
}

/** Uploads a recorded voice note; the server converts it and broadcasts the message. */
export async function postVoice(
  roomId: string,
  audio: Blob,
  clientId: string,
): Promise<Message> {
  const { message } = await api<{ message: Message }>(
    `/api/rooms/${roomId}/voice?clientId=${encodeURIComponent(clientId)}`,
    { blob: audio },
  )
  return message
}
