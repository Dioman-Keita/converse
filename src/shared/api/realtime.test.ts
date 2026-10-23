// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { RealtimeClient } from "./realtime"

/** Minimal stand-in for the browser WebSocket: records what the client sends. */
class FakeSocket {
  static instances: FakeSocket[] = []
  static readonly OPEN = 1
  readyState = FakeSocket.OPEN
  sent: unknown[] = []
  onmessage: ((message: { data: string }) => void) | null = null
  onclose: (() => void) | null = null

  constructor(readonly url: string) {
    FakeSocket.instances.push(this)
  }
  send(data: string) {
    this.sent.push(JSON.parse(data))
  }
  close() {
    this.onclose?.()
  }
  receive(event: unknown) {
    this.onmessage?.({ data: JSON.stringify(event) })
  }
  subscribes(roomId: string) {
    return this.sent.filter(
      (e) => (e as { type: string; roomId: string }).type === "subscribe" &&
        (e as { roomId: string }).roomId === roomId,
    ).length
  }
}

describe("RealtimeClient subscriptions", () => {
  let client: RealtimeClient

  beforeEach(() => {
    vi.useFakeTimers()
    FakeSocket.instances = []
    vi.stubGlobal("WebSocket", FakeSocket)
    client = new RealtimeClient()
    client.start()
    FakeSocket.instances[0].receive({ type: "ready", userId: "me" })
  })

  afterEach(() => {
    client.stop()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it("retries a subscription the server failed to confirm, with backoff", () => {
    const socket = FakeSocket.instances[0]
    client.subscribe("room-1")
    expect(socket.subscribes("room-1")).toBe(1)

    socket.receive({ type: "error", code: "internal", message: "Server error", roomId: "room-1" })
    vi.advanceTimersByTime(999)
    expect(socket.subscribes("room-1")).toBe(1)
    vi.advanceTimersByTime(1)
    expect(socket.subscribes("room-1")).toBe(2)

    // Fails again: next retry waits twice as long.
    socket.receive({ type: "error", code: "internal", message: "Server error", roomId: "room-1" })
    vi.advanceTimersByTime(1_999)
    expect(socket.subscribes("room-1")).toBe(2)
    vi.advanceTimersByTime(1)
    expect(socket.subscribes("room-1")).toBe(3)

    // Confirmed: no more retries even if a stale error shows up.
    socket.receive({ type: "subscribed", roomId: "room-1" })
    socket.receive({ type: "error", code: "internal", message: "Server error", roomId: "room-1" })
    vi.advanceTimersByTime(60_000)
    expect(socket.subscribes("room-1")).toBe(3)
  })

  it("does not retry forbidden rooms or errors without a room", () => {
    const socket = FakeSocket.instances[0]
    client.subscribe("room-2")
    socket.receive({ type: "error", code: "forbidden", message: "nope", roomId: "room-2" })
    socket.receive({ type: "error", code: "internal", message: "Server error" })
    vi.advanceTimersByTime(60_000)
    expect(socket.subscribes("room-2")).toBe(1)
  })

  it("resubscribes every room after a reconnect", () => {
    client.subscribe("a")
    client.subscribe("b")
    FakeSocket.instances[0].close()
    vi.advanceTimersByTime(500)

    const next = FakeSocket.instances[1]
    next.receive({ type: "ready", userId: "me" })
    expect(next.subscribes("a")).toBe(1)
    expect(next.subscribes("b")).toBe(1)
  })
})
