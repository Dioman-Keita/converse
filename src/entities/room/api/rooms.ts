import { api } from "@/shared/api"

import type { Room } from "../model/types"

export async function fetchRooms(): Promise<Room[]> {
  const { rooms } = await api<{ rooms: Room[] }>("/api/rooms")
  return rooms
}
