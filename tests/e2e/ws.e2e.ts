import { afterEach, describe, expect, it } from "vitest"

import { api, baseUrl, bearer, connect, createDirectRoom, isType, register } from "./helpers"
import type { Client } from "./helpers"

const open: Client[] = []
async function track(client: Promise<Client>) {
  const c = await client
  open.push(c)
  return c
}
afterEach(() => {
  for (const c of open.splice(0)) c.close()
})

const isError = (code: string) => (e: { type: string; code?: string }) =>
  e.type === "error" && e.code === code

describe("websocket /ws", () => {
  it("refuses a handshake without authentication", async () => {
    await expect(connect({})).rejects.toThrow()
    await expect(connect({ authorization: "Bearer not-a-real-token" })).rejects.toThrow()
  })

  it("sends ready with the user id, then confirms subscriptions", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)

    const ws = await track(connect(bearer(alice)))
    expect(await ws.next(isType("ready"))).toMatchObject({ userId: alice.user.id })

    ws.send({ type: "subscribe", roomId: room.id })
    expect(await ws.next(isType("subscribed"))).toMatchObject({ roomId: room.id })
  })

  it("forbids subscribing to a room the user is not a member of", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const stranger = await register("stranger")
    const room = await createDirectRoom(alice, bob)

    const ws = await track(connect(bearer(stranger)))
    ws.send({ type: "subscribe", roomId: room.id })
    await ws.next(isError("forbidden"))
  })

  it("delivers a message to the other member and echoes clientId to the sender", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)

    const bobWs = await track(connect(bearer(bob)))
    bobWs.send({ type: "subscribe", roomId: room.id })
    await bobWs.next(isType("subscribed"))

    // Alice sends without subscribing first: sending implies interest.
    const aliceWs = await track(connect(bearer(alice)))
    await aliceWs.next(isType("ready"))
    aliceWs.send({ type: "send", roomId: room.id, body: "  bonjour  ", clientId: "c-1" })

    const echo = await aliceWs.next(isType("message"))
    expect(echo.clientId).toBe("c-1")
    expect(echo.message).toMatchObject({ roomId: room.id, authorId: alice.user.id, body: "bonjour" })

    const received = await bobWs.next(isType("message"))
    expect(received.message).toMatchObject({ id: echo.message.id, body: "bonjour" })

    const history = await api(`/api/rooms/${room.id}/messages`, { token: bob.token })
    expect(history.json.messages[0].id).toBe(echo.message.id)
  })

  it("rejects an empty body with bad_body", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)

    const ws = await track(connect(bearer(alice)))
    ws.send({ type: "send", roomId: room.id, body: "   ", clientId: "c-empty" })
    const error = await ws.next(isError("bad_body"))
    expect(error.clientId).toBe("c-empty")
  })

  it("answers a null payload with an error and keeps the connection usable", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)

    const ws = await track(connect(bearer(alice)))
    ws.sendRaw("null")
    await ws.next(isType("error"))
    ws.sendRaw("{not json")
    await ws.next(isType("error"))

    ws.send({ type: "subscribe", roomId: room.id })
    await ws.next(isType("subscribed"))
  })

  it("refuses a cookie-authenticated handshake from a foreign Origin (CSWSH)", async () => {
    const alice = await register("alice")
    const cookie = `converse_session=${alice.token}`

    await expect(connect({ cookie, origin: "https://evil.example" })).rejects.toThrow()

    const ws = await track(connect({ cookie, origin: baseUrl }))
    expect(await ws.next(isType("ready"))).toMatchObject({ userId: alice.user.id })
  })

  it("pushes a room event to every member when a room is created", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const carol = await register("carol")

    const bobWs = await track(connect(bearer(bob)))
    const carolWs = await track(connect(bearer(carol)))
    await bobWs.next(isType("ready"))
    await carolWs.next(isType("ready"))

    const res = await api("/api/rooms", {
      method: "POST",
      token: alice.token,
      body: { type: "group", name: "Équipe", memberEmails: [bob.email, carol.email] },
    })
    expect(res.status).toBe(200)

    for (const ws of [bobWs, carolWs]) {
      const event = await ws.next(isType("room"))
      expect(event.room).toMatchObject({ id: res.json.room.id, name: "Équipe", type: "group" })
      expect(event.room.members).toHaveLength(3)
    }
  })
})
