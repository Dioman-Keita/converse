/**
 * In-memory realtime fan-out: roomId → connected sockets.
 *
 * Single-process by design (one `app` container). If Converse ever runs
 * several app instances, replace this with Postgres LISTEN/NOTIFY.
 */
type Socket = { send: (data: string) => unknown }

const rooms = new Map<string, Set<Socket>>()

export function joinRoom(roomId: string, socket: Socket) {
  let sockets = rooms.get(roomId)
  if (!sockets) rooms.set(roomId, (sockets = new Set()))
  sockets.add(socket)
}

export function leaveRoom(roomId: string, socket: Socket) {
  const sockets = rooms.get(roomId)
  if (!sockets) return
  sockets.delete(socket)
  if (sockets.size === 0) rooms.delete(roomId)
}

export function leaveAllRooms(socket: Socket) {
  for (const roomId of rooms.keys()) leaveRoom(roomId, socket)
}

export function broadcast(roomId: string, event: ServerEvent) {
  const sockets = rooms.get(roomId)
  if (!sockets) return
  const data = JSON.stringify(event)
  for (const socket of sockets) socket.send(data)
}

export type MessageDto = {
  id: string
  roomId: string
  authorId: string
  body: string
  createdAt: string
}

/** Server → client events (shared contract with web & Android clients). */
export type ServerEvent =
  | { type: "ready"; userId: string }
  | { type: "subscribed"; roomId: string }
  | { type: "message"; message: MessageDto; clientId?: string }
  | { type: "error"; code: string; message: string; clientId?: string }

/** Client → server events. */
export type ClientEvent =
  | { type: "subscribe"; roomId: string }
  | { type: "unsubscribe"; roomId: string }
  | { type: "send"; roomId: string; body: string; clientId?: string }
