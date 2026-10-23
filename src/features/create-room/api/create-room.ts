import type { Room } from "@/entities/room"
import { api } from "@/shared/api"

export type CreateRoomInput =
  | { type: "direct"; memberEmails: [string] }
  | { type: "group"; name: string; memberEmails: string[] }

/** Creates a conversation (or returns the existing direct one with that person). */
export async function createRoom(input: CreateRoomInput): Promise<Room> {
  const { room } = await api<{ room: Room }>("/api/rooms", { json: input })
  return room
}
