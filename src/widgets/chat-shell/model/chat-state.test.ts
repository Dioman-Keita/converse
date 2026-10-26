import { describe, expect, it } from "vitest"

import type { Message } from "@/entities/message"
import type { Room } from "@/entities/room"

import { chatReducer, initialChatState } from "./chat-state"
import type { ChatState } from "./chat-state"

const ME = "me"
const room: Room = {
  id: "r1",
  name: "",
  type: "direct",
  createdAt: "2026-10-26T09:00:00.000Z",
  lastMessageAt: null,
  members: [],
}

const video = (status: "processing" | "ready"): Message => ({
  id: "m1",
  roomId: "r1",
  authorId: "bob",
  kind: "video",
  body: "",
  video:
    status === "ready"
      ? { status, url: "/api/media/m1", posterUrl: "/api/media/m1/poster", width: 1280, height: 720, durationMs: 4000 }
      : { status },
  createdAt: "2026-10-26T10:00:00.000Z",
})

function withRoom(): ChatState {
  return chatReducer(initialChatState, { type: "roomsLoaded", rooms: [room] })
}

describe("chat state — media", () => {
  it("replaces a message the server sends again (video finished converting)", () => {
    let state = chatReducer(withRoom(), { type: "selected", roomId: "r1" })
    state = chatReducer(state, { type: "historyLoading", roomId: "r1" })
    state = chatReducer(state, {
      type: "historyLoaded",
      roomId: "r1",
      page: { messages: [video("processing")], nextCursor: null },
      mode: "latest",
    })
    state = chatReducer(state, { type: "messageReceived", message: video("ready"), currentUserId: ME })

    const items = state.history.r1?.items ?? []
    expect(items).toHaveLength(1)
    expect(items[0].video).toMatchObject({ status: "ready", url: "/api/media/m1" })
  })

  it("counts a new video once, not again when it becomes ready", () => {
    let state = withRoom()
    state = chatReducer(state, { type: "messageReceived", message: video("processing"), currentUserId: ME })
    state = chatReducer(state, { type: "messageReceived", message: video("ready"), currentUserId: ME })
    expect(state.unread.r1).toBe(1)
  })

  it("tracks upload progress of a pending photo, then swaps in the server message", () => {
    let state = chatReducer(withRoom(), { type: "historyLoading", roomId: "r1" })
    state = chatReducer(state, {
      type: "historyLoaded",
      roomId: "r1",
      page: { messages: [], nextCursor: null },
      mode: "latest",
    })
    state = chatReducer(state, {
      type: "messagePending",
      message: {
        id: "local-c1",
        clientId: "c1",
        roomId: "r1",
        authorId: ME,
        kind: "image",
        body: "",
        createdAt: "2026-10-26T10:00:00.000Z",
        status: "pending",
        upload: { progress: 0, localUrl: "blob:x" },
      },
    })
    state = chatReducer(state, { type: "uploadProgress", roomId: "r1", clientId: "c1", progress: 0.4 })
    expect(state.history.r1?.items[0].upload?.progress).toBe(0.4)

    state = chatReducer(state, {
      type: "messageReceived",
      clientId: "c1",
      currentUserId: ME,
      message: {
        id: "srv",
        roomId: "r1",
        authorId: ME,
        kind: "image",
        body: "",
        image: { url: "/api/media/srv", width: 10, height: 10 },
        createdAt: "2026-10-26T10:00:01.000Z",
      },
    })
    const [item] = state.history.r1?.items ?? []
    expect(item).toMatchObject({ id: "srv", status: "sent", clientId: "c1" })
    expect(item.upload).toBeUndefined()
  })
})
