import { api, uploadFile } from "@/shared/api"

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

/** Uploads a photo or video (raw file body), reporting upload progress (0–1). */
export async function uploadMedia(
  roomId: string,
  file: File,
  clientId: string,
  onProgress: (fraction: number) => void,
): Promise<Message> {
  const { message } = await uploadFile<{ message: Message }>(
    `/api/rooms/${roomId}/media?clientId=${encodeURIComponent(clientId)}`,
    file,
    onProgress,
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
