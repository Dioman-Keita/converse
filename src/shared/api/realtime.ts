import type { ClientEvent, ServerEvent } from "./contract"

export type RealtimeStatus = "connecting" | "open" | "closed"

type EventListener = (event: ServerEvent) => void
type StatusListener = (status: RealtimeStatus) => void

const MAX_BACKOFF_MS = 15_000

/**
 * Browser WebSocket client for `/ws` (cookie-authenticated, same origin).
 *
 * - Reconnects with exponential backoff, immediately when the tab becomes
 *   visible again or the network comes back (mobile browsers drop sockets).
 * - Remembers room subscriptions and replays them after every reconnect.
 */
export class RealtimeClient {
  private ws: WebSocket | undefined
  private attempt = 0
  private retryTimer: ReturnType<typeof setTimeout> | undefined
  private stopped = true
  private readonly rooms = new Set<string>()
  private readonly listeners = new Set<EventListener>()
  private readonly statusListeners = new Set<StatusListener>()
  status: RealtimeStatus = "closed"

  start() {
    if (!this.stopped) return
    this.stopped = false
    window.addEventListener("online", this.reconnectNow)
    document.addEventListener("visibilitychange", this.onVisibility)
    this.open()
  }

  stop() {
    this.stopped = true
    clearTimeout(this.retryTimer)
    window.removeEventListener("online", this.reconnectNow)
    document.removeEventListener("visibilitychange", this.onVisibility)
    this.ws?.close()
    this.ws = undefined
    this.rooms.clear()
    this.setStatus("closed")
  }

  onEvent(listener: EventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  subscribe(roomId: string) {
    if (this.rooms.has(roomId)) return
    this.rooms.add(roomId)
    this.send({ type: "subscribe", roomId })
  }

  /** Returns false when the socket is not open (caller may fall back to HTTP). */
  send(event: ClientEvent): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) return false
    this.ws.send(JSON.stringify(event))
    return true
  }

  private open() {
    clearTimeout(this.retryTimer)
    this.setStatus("connecting")
    const protocol = location.protocol === "https:" ? "wss:" : "ws:"
    const ws = new WebSocket(`${protocol}//${location.host}/ws`)
    this.ws = ws

    ws.onmessage = (message) => {
      let event: ServerEvent
      try {
        event = JSON.parse(String(message.data)) as ServerEvent
      } catch {
        return
      }
      if (event.type === "ready") {
        this.attempt = 0
        this.setStatus("open")
        for (const roomId of this.rooms) this.send({ type: "subscribe", roomId })
      }
      for (const listener of this.listeners) listener(event)
    }

    ws.onclose = () => {
      if (this.ws !== ws) return
      this.ws = undefined
      this.setStatus("closed")
      if (this.stopped) return
      const delay = Math.min(MAX_BACKOFF_MS, 500 * 2 ** this.attempt++)
      this.retryTimer = setTimeout(() => this.open(), delay)
    }
  }

  private readonly reconnectNow = () => {
    if (this.stopped || this.ws) return
    this.attempt = 0
    this.open()
  }

  private readonly onVisibility = () => {
    if (document.visibilityState === "visible") this.reconnectNow()
  }

  private setStatus(status: RealtimeStatus) {
    if (this.status === status) return
    this.status = status
    for (const listener of this.statusListeners) listener(status)
  }
}
