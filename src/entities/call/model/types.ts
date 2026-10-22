import type { UserId } from "@/entities/user"
import type { RoomId } from "@/entities/room"

/**
 * Domain types for realtime calls — future WebRTC/LiveKit layer.
 * Signaling goes through the /ws server; media stays on a specialized SFU.
 */
export type CallId = string

export type CallStatus = "ringing" | "active" | "ended" | "missed"

export type Call = {
  id: CallId
  roomId: RoomId
  initiatorId: UserId
  participantIds: UserId[]
  status: CallStatus
  startedAt?: number
  endedAt?: number
}
