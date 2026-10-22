/**
 * Realtime endpoint: `wss://<host>/ws`
 *
 * Auth: session cookie (web) or `Authorization: Bearer <token>` (Android).
 * Protocol: JSON `ClientEvent` in, JSON `ServerEvent` out — see utils/hub.ts.
 */
import { defineWebSocketHandler } from "nitro/h3"

import { getSessionUser } from "../utils/auth"
import { joinRoom, leaveAllRooms, leaveRoom } from "../utils/hub"
import type { ClientEvent, ServerEvent } from "../utils/hub"
import { MAX_MESSAGE_LENGTH, postMessage } from "../utils/messages"
import { UUID_RE, isRoomMember } from "../utils/rooms"

type PeerContext = { userId?: string; rooms?: Set<string> }

export default defineWebSocketHandler({
  async upgrade(request) {
    const user = await getSessionUser(request.headers)
    if (!user) return new Response("Unauthorized", { status: 401 })
    return { context: { userId: user.id, rooms: new Set() } satisfies PeerContext }
  },

  open(peer) {
    const { userId } = peer.context as PeerContext
    send(peer, { type: "ready", userId: userId! })
  },

  async message(peer, raw) {
    const context = peer.context as Required<PeerContext>
    let event: ClientEvent
    try {
      event = raw.json<ClientEvent>()
    } catch {
      return send(peer, { type: "error", code: "bad_json", message: "Invalid JSON" })
    }

    if (!("roomId" in event) || typeof event.roomId !== "string" || !UUID_RE.test(event.roomId)) {
      return send(peer, { type: "error", code: "bad_room", message: "Invalid room id" })
    }

    // Membership is checked once per room per connection, then cached.
    if (!context.rooms.has(event.roomId)) {
      if (event.type === "unsubscribe") return
      if (!(await isRoomMember(event.roomId, context.userId))) {
        return send(peer, { type: "error", code: "forbidden", message: "Not a member of this room" })
      }
    }

    switch (event.type) {
      case "subscribe":
        context.rooms.add(event.roomId)
        joinRoom(event.roomId, peer)
        return send(peer, { type: "subscribed", roomId: event.roomId })

      case "unsubscribe":
        context.rooms.delete(event.roomId)
        return leaveRoom(event.roomId, peer)

      case "send": {
        const body = typeof event.body === "string" ? event.body.trim() : ""
        const clientId = typeof event.clientId === "string" ? event.clientId : undefined
        if (!body || body.length > MAX_MESSAGE_LENGTH) {
          return send(peer, {
            type: "error",
            code: "bad_body",
            message: `Message must be 1-${MAX_MESSAGE_LENGTH} characters`,
            clientId,
          })
        }
        // Sending implies interest: the sender also receives the echo (with its clientId).
        context.rooms.add(event.roomId)
        joinRoom(event.roomId, peer)
        await postMessage(event.roomId, context.userId, body, clientId)
        return
      }

      default:
        return send(peer, { type: "error", code: "bad_type", message: "Unknown event type" })
    }
  },

  close(peer) {
    leaveAllRooms(peer)
  },
})

function send(peer: { send: (data: string) => unknown }, event: ServerEvent) {
  peer.send(JSON.stringify(event))
}
