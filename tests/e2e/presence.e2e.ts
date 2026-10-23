import { afterEach, describe, expect, it } from "vitest"

import { api, bearer, connect, createDirectRoom, isType, register } from "./helpers"
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

describe("presence", () => {
  it("reports members offline until they connect, then online", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    await createDirectRoom(alice, bob)

    const before = await api("/api/rooms", { token: alice.token })
    const bobBefore = before.json.rooms[0].members.find((m: { id: string }) => m.id === bob.user.id)
    expect(bobBefore).toMatchObject({ online: false, lastSeenAt: null })

    const aliceWs = await track(connect(bearer(alice)))
    await aliceWs.next(isType("ready"))
    const bobWs = await track(connect(bearer(bob)))
    await bobWs.next(isType("ready"))

    const online = await aliceWs.next((e) => e.type === "presence" && e.userId === bob.user.id)
    expect(online.online).toBe(true)
    expect(typeof online.lastSeenAt).toBe("string")

    const after = await api("/api/rooms", { token: alice.token })
    const bobAfter = after.json.rooms[0].members.find((m: { id: string }) => m.id === bob.user.id)
    expect(bobAfter.online).toBe(true)
  })

  it("announces offline only when the user's last socket closes", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    await createDirectRoom(alice, bob)

    const aliceWs = await track(connect(bearer(alice)))
    await aliceWs.next(isType("ready"))
    const bobTab1 = await connect(bearer(bob))
    const bobTab2 = await connect(bearer(bob))
    await aliceWs.next((e) => e.type === "presence" && e.userId === bob.user.id && e.online)

    bobTab1.close()
    // Still online through the second tab: no offline event.
    await expect(
      aliceWs.next((e) => e.type === "presence" && e.userId === bob.user.id && !e.online, 800),
    ).rejects.toThrow()

    bobTab2.close()
    const offline = await aliceWs.next(
      (e) => e.type === "presence" && e.userId === bob.user.id && !e.online,
    )
    expect(Date.parse(offline.lastSeenAt)).toBeGreaterThan(Date.now() - 10_000)
  })

  it("does not leak presence to users who share no room", async () => {
    const alice = await register("alice")
    const stranger = await register("stranger")
    const strangerWs = await track(connect(bearer(stranger)))
    await strangerWs.next(isType("ready"))

    await track(connect(bearer(alice)))
    await expect(strangerWs.next(isType("presence"), 800)).rejects.toThrow()
  })
})

describe("typing", () => {
  it("relays typing start and stop to the other member", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)

    const aliceWs = await track(connect(bearer(alice)))
    await aliceWs.next(isType("ready"))
    const bobWs = await track(connect(bearer(bob)))
    await bobWs.next(isType("ready"))
    bobWs.send({ type: "subscribe", roomId: room.id })
    await bobWs.next(isType("subscribed"))

    aliceWs.send({ type: "typing", roomId: room.id, typing: true })
    const start = await bobWs.next(isType("typing"))
    expect(start).toMatchObject({ roomId: room.id, userId: alice.user.id, typing: true })

    aliceWs.send({ type: "typing", roomId: room.id, typing: false })
    const stop = await bobWs.next(isType("typing"))
    expect(stop).toMatchObject({ userId: alice.user.id, typing: false })
  })

  it("rejects typing in a room the user doesn't belong to", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const eve = await register("eve")
    const room = await createDirectRoom(alice, bob)

    const eveWs = await track(connect(bearer(eve)))
    await eveWs.next(isType("ready"))
    eveWs.send({ type: "typing", roomId: room.id, typing: true })
    const error = await eveWs.next(isType("error"))
    expect(error.code).toBe("forbidden")
  })
})
