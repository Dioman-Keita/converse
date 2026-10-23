/**
 * In-memory realtime fan-out:
 * - roomId → sockets subscribed to that room (messages)
 * - userId → sockets of that user (room membership changes)
 *
 * Single-process by design (one `app` container). If Converse ever runs
 * several app instances, replace this with Postgres LISTEN/NOTIFY.
 */
type Socket = { send: (data: string) => unknown }

const rooms = new Map<string, Set<Socket>>()
const users = new Map<string, Set<Socket>>()

function add(map: Map<string, Set<Socket>>, key: string, socket: Socket) {
  let sockets = map.get(key)
  if (!sockets) map.set(key, (sockets = new Set()))
  sockets.add(socket)
}

function remove(map: Map<string, Set<Socket>>, key: string, socket: Socket) {
  const sockets = map.get(key)
  if (!sockets) return
  sockets.delete(socket)
  if (sockets.size === 0) map.delete(key)
}

function sendAll(
  map: Map<string, Set<Socket>>,
  key: string,
  data: string,
) {
  const sockets = map.get(key)
  if (!sockets) return
  for (const socket of sockets) {
    // One broken socket must not stop the fan-out to the others.
    try {
      socket.send(data)
    } catch {
      remove(map, key, socket)
    }
  }
}

export function joinRoom(roomId: string, socket: Socket) {
  add(rooms, roomId, socket)
}

export function leaveRoom(roomId: string, socket: Socket) {
  remove(rooms, roomId, socket)
}

export function registerUserSocket(userId: string, socket: Socket) {
  add(users, userId, socket)
}

/** Drops a closed socket from every room and user channel. */
export function disconnect(userId: string, socket: Socket) {
  for (const roomId of [...rooms.keys()]) remove(rooms, roomId, socket)
  remove(users, userId, socket)
}

export function broadcast(roomId: string, event: ServerEvent) {
  sendAll(rooms, roomId, JSON.stringify(event))
}

export function notifyUsers(userIds: string[], event: ServerEvent) {
  const data = JSON.stringify(event)
  for (const userId of userIds) sendAll(users, userId, data)
}

export type MessageDto = {
  id: string
  roomId: string
  authorId: string
  body: string
  createdAt: string
}

export type RoomMemberDto = { id: string; name: string; email: string }

export type RoomDto = {
  id: string
  name: string
  type: "direct" | "group"
  createdAt: string
  lastMessageAt: string | null
  members: RoomMemberDto[]
}

/** Server → client events (shared contract with web & Android clients). */
export type ServerEvent =
  | { type: "ready"; userId: string }
  | { type: "subscribed"; roomId: string }
  | { type: "message"; message: MessageDto; clientId?: string }
  | { type: "room"; room: RoomDto }
  | { type: "error"; code: string; message: string; clientId?: string }

/** Client → server events. */
export type ClientEvent =
  | { type: "subscribe"; roomId: string }
  | { type: "unsubscribe"; roomId: string }
  | { type: "send"; roomId: string; body: string; clientId?: string }
