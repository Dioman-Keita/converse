import type { ChatMessage, Message, MessagePage } from "@/entities/message"
import type { Room } from "@/entities/room"
import { sortRooms } from "@/entities/room"
import type { RealtimeStatus } from "@/shared/api"

export type RoomHistory = {
  items: ChatMessage[] // oldest → newest
  nextCursor: string | null
  status: "loading" | "ready" | "error"
  loadingOlder: boolean
}

export type ChatState = {
  roomsStatus: "loading" | "ready" | "error"
  rooms: Room[]
  history: Record<string, RoomHistory | undefined>
  unread: Record<string, number | undefined>
  activeRoomId: string | undefined
  connection: RealtimeStatus
}

export type ChatAction =
  | { type: "roomsLoaded"; rooms: Room[] }
  | { type: "roomsFailed" }
  | { type: "roomUpserted"; room: Room }
  | { type: "selected"; roomId: string | undefined }
  | { type: "historyLoading"; roomId: string; older?: boolean }
  | { type: "historyLoaded"; roomId: string; page: MessagePage; mode: "latest" | "older" }
  | { type: "historyFailed"; roomId: string }
  | { type: "messagePending"; message: ChatMessage }
  | { type: "messageReceived"; message: Message; clientId?: string; currentUserId: string }
  | { type: "messageFailed"; roomId: string; clientId: string }
  | { type: "messageDiscarded"; roomId: string; clientId: string }
  | { type: "connection"; status: RealtimeStatus }

export const initialChatState: ChatState = {
  roomsStatus: "loading",
  rooms: [],
  history: {},
  unread: {},
  activeRoomId: undefined,
  connection: "closed",
}

const sent = (m: Message): ChatMessage => ({ ...m, status: "sent" })

const byTime = (a: ChatMessage, b: ChatMessage) =>
  a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)

/** Merge server messages into a list, deduped by id, keeping local pending/failed ones. */
function merge(existing: ChatMessage[], incoming: Message[]): ChatMessage[] {
  const ids = new Set(existing.map((m) => m.id))
  const added = incoming.filter((m) => !ids.has(m.id)).map(sent)
  return [...existing, ...added].sort(byTime)
}

function updateHistory(
  state: ChatState,
  roomId: string,
  update: (history: RoomHistory) => RoomHistory,
): ChatState {
  const current = state.history[roomId]
  if (!current) return state
  return { ...state, history: { ...state.history, [roomId]: update(current) } }
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "roomsLoaded":
      return { ...state, roomsStatus: "ready", rooms: sortRooms(action.rooms) }

    case "roomsFailed":
      return { ...state, roomsStatus: state.rooms.length ? "ready" : "error" }

    case "roomUpserted": {
      const others = state.rooms.filter((r) => r.id !== action.room.id)
      return { ...state, rooms: sortRooms([action.room, ...others]) }
    }

    case "selected":
      return {
        ...state,
        activeRoomId: action.roomId,
        unread: action.roomId ? { ...state.unread, [action.roomId]: 0 } : state.unread,
      }

    case "historyLoading": {
      if (action.older) {
        return updateHistory(state, action.roomId, (h) => ({ ...h, loadingOlder: true }))
      }
      const current = state.history[action.roomId]
      return {
        ...state,
        history: {
          ...state.history,
          [action.roomId]: current
            ? { ...current, status: current.status === "ready" ? "ready" : "loading" }
            : { items: [], nextCursor: null, status: "loading", loadingOlder: false },
        },
      }
    }

    case "historyLoaded":
      return updateHistory(state, action.roomId, (h) => ({
        items: merge(h.items, action.page.messages),
        // A fresh "latest" page only moves the cursor on first load; older pages always do.
        nextCursor:
          action.mode === "older" || h.status !== "ready" ? action.page.nextCursor : h.nextCursor,
        status: "ready",
        loadingOlder: false,
      }))

    case "historyFailed":
      return updateHistory(state, action.roomId, (h) => ({
        ...h,
        status: h.status === "ready" ? "ready" : "error",
        loadingOlder: false,
      }))

    case "messagePending":
      return updateHistory(state, action.message.roomId, (h) => ({
        ...h,
        items: [...h.items, action.message],
      }))

    case "messageReceived": {
      const { message, clientId } = action
      let next = updateHistory(state, message.roomId, (h) => {
        const pending = clientId ? h.items.findIndex((m) => m.clientId === clientId) : -1
        if (pending >= 0) {
          const items = [...h.items]
          // Keep clientId so the UI keeps the same React key (no remount on confirm).
          items[pending] = { ...sent(message), clientId }
          return { ...h, items: items.sort(byTime) }
        }
        return { ...h, items: merge(h.items, [message]) }
      })

      const room = next.rooms.find((r) => r.id === message.roomId)
      if (room && (!room.lastMessageAt || room.lastMessageAt < message.createdAt)) {
        const others = next.rooms.filter((r) => r.id !== room.id)
        next = {
          ...next,
          rooms: sortRooms([{ ...room, lastMessageAt: message.createdAt }, ...others]),
        }
      }

      const fromSomeoneElse = message.authorId !== action.currentUserId
      const alreadyKnown = state.history[message.roomId]?.items.some((m) => m.id === message.id)
      if (fromSomeoneElse && !alreadyKnown && message.roomId !== state.activeRoomId) {
        next = {
          ...next,
          unread: { ...next.unread, [message.roomId]: (next.unread[message.roomId] ?? 0) + 1 },
        }
      }
      return next
    }

    case "messageFailed":
      return updateHistory(state, action.roomId, (h) => ({
        ...h,
        items: h.items.map((m) =>
          m.clientId === action.clientId && m.status === "pending"
            ? { ...m, status: "failed" }
            : m,
        ),
      }))

    case "messageDiscarded":
      return updateHistory(state, action.roomId, (h) => ({
        ...h,
        items: h.items.filter((m) => m.clientId !== action.clientId || m.status === "sent"),
      }))

    case "connection":
      return { ...state, connection: action.status }
  }
}
