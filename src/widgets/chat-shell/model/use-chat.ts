import { useCallback, useEffect, useReducer, useRef } from "react"

import { fetchMessages, postMessage } from "@/entities/message"
import type { ChatMessage } from "@/entities/message"
import { fetchRooms } from "@/entities/room"
import type { Room } from "@/entities/room"
import { fetchCurrentUser } from "@/entities/user"
import { RealtimeClient } from "@/shared/api"

import { chatReducer, initialChatState } from "./chat-state"

const PENDING_TIMEOUT_MS = 10_000

function newClientId(): string {
  // randomUUID only exists in secure contexts (https / localhost); plain-http LAN access falls back.
  if (window.isSecureContext) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/**
 * Chat session state for the current user: rooms, per-room history, unread counts,
 * optimistic sending and live updates over `/ws`.
 */
export function useChat(currentUserId: string, onSessionExpired: () => void) {
  const [state, dispatch] = useReducer(chatReducer, initialChatState)
  const realtime = useRef<RealtimeClient | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const loadLatest = useCallback(async (roomId: string) => {
    dispatch({ type: "historyLoading", roomId })
    try {
      const page = await fetchMessages(roomId)
      dispatch({ type: "historyLoaded", roomId, page, mode: "latest" })
    } catch {
      dispatch({ type: "historyFailed", roomId })
    }
  }, [])

  const loadRooms = useCallback(async () => {
    try {
      const rooms = await fetchRooms()
      dispatch({ type: "roomsLoaded", rooms })
      for (const room of rooms) realtime.current?.subscribe(room.id)
    } catch {
      dispatch({ type: "roomsFailed" })
    }
  }, [])

  useEffect(() => {
    const client = new RealtimeClient()
    realtime.current = client
    let connectedBefore = false

    const offEvent = client.onEvent((event) => {
      switch (event.type) {
        case "ready":
          // After a reconnect, catch up on anything missed while offline.
          if (connectedBefore) {
            void loadRooms()
            for (const [roomId, history] of Object.entries(stateRef.current.history)) {
              if (history?.status === "ready") void loadLatest(roomId)
            }
          }
          connectedBefore = true
          break
        case "room":
          dispatch({ type: "roomUpserted", room: event.room })
          client.subscribe(event.room.id)
          break
        case "message":
          dispatch({
            type: "messageReceived",
            message: event.message,
            clientId: event.clientId,
            currentUserId,
          })
          break
        case "error":
          if (event.clientId) {
            const roomId = findRoomOfClientMessage(stateRef.current.history, event.clientId)
            if (roomId) dispatch({ type: "messageFailed", roomId, clientId: event.clientId })
          }
          break
      }
    })

    const offStatus = client.onStatus((status) => {
      dispatch({ type: "connection", status })
      if (status === "closed") {
        // A socket refused at handshake usually means the session expired.
        void fetchCurrentUser()
          .then((user) => {
            if (!user) onSessionExpired()
          })
          .catch(() => {})
      }
    })

    client.start()
    void loadRooms()

    return () => {
      offEvent()
      offStatus()
      client.stop()
      realtime.current = null
    }
  }, [currentUserId, loadLatest, loadRooms, onSessionExpired])

  const selectRoom = useCallback(
    (roomId: string | undefined) => {
      dispatch({ type: "selected", roomId })
      if (roomId && !stateRef.current.history[roomId]) void loadLatest(roomId)
    },
    [loadLatest],
  )

  const loadOlder = useCallback(async (roomId: string) => {
    const history = stateRef.current.history[roomId]
    if (!history?.nextCursor || history.loadingOlder) return
    dispatch({ type: "historyLoading", roomId, older: true })
    try {
      const page = await fetchMessages(roomId, history.nextCursor)
      dispatch({ type: "historyLoaded", roomId, page, mode: "older" })
    } catch {
      dispatch({ type: "historyFailed", roomId })
    }
  }, [])

  const send = useCallback(
    (roomId: string, body: string) => {
      const clientId = newClientId()
      const pending: ChatMessage = {
        id: `local-${clientId}`,
        clientId,
        roomId,
        authorId: currentUserId,
        body,
        createdAt: new Date().toISOString(),
        status: "pending",
      }
      dispatch({ type: "messagePending", message: pending })

      const viaSocket = realtime.current?.send({ type: "send", roomId, body, clientId })
      if (!viaSocket) {
        // Socket down (e.g. reconnecting): fall back to HTTP.
        postMessage(roomId, body, clientId)
          .then((message) =>
            dispatch({ type: "messageReceived", message, clientId, currentUserId }),
          )
          .catch(() => dispatch({ type: "messageFailed", roomId, clientId }))
        return
      }
      setTimeout(() => dispatch({ type: "messageFailed", roomId, clientId }), PENDING_TIMEOUT_MS)
    },
    [currentUserId],
  )

  const retry = useCallback(
    (message: ChatMessage) => {
      if (!message.clientId) return
      dispatch({ type: "messageDiscarded", roomId: message.roomId, clientId: message.clientId })
      send(message.roomId, message.body)
    },
    [send],
  )

  const addRoom = useCallback((room: Room) => {
    dispatch({ type: "roomUpserted", room })
    realtime.current?.subscribe(room.id)
  }, [])

  return { state, selectRoom, loadOlder, send, retry, addRoom }
}

function findRoomOfClientMessage(
  history: Record<string, { items: ChatMessage[] } | undefined>,
  clientId: string,
): string | undefined {
  for (const [roomId, h] of Object.entries(history)) {
    if (h?.items.some((m) => m.clientId === clientId)) return roomId
  }
  return undefined
}
