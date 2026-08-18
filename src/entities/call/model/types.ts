import type { UserId } from "@/entities/user"
import type { RoomId } from "@/entities/room"

/**
 * Domain types for realtime calls — future Convex + WebRTC/LiveKit layer.
 * Convex can own signaling/presence; media stays on a specialized SFU.
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
