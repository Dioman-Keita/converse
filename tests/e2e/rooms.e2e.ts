import { describe, expect, it } from "vitest"

import { api, createDirectRoom, register, sql, uniqueEmail } from "./helpers"

describe("rooms", () => {
  it("creates a direct room with both members", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const res = await api("/api/rooms", {
      method: "POST",
      token: alice.token,
      body: { type: "direct", memberEmails: [bob.email] },
    })
    expect(res.status).toBe(200)
    expect(res.json.created).toBe(true)
    expect(res.json.room.type).toBe("direct")
    expect(res.json.room.members).toHaveLength(2)
    for (const member of res.json.room.members) {
      expect(Object.keys(member).sort()).toEqual(["email", "id", "lastSeenAt", "name", "online"])
    }
    expect(res.json.room.members.map((m: { id: string }) => m.id).sort()).toEqual(
      [alice.user.id, bob.user.id].sort(),
    )
  })

  it("reuses an existing direct room instead of creating a duplicate", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const first = await api("/api/rooms", {
      method: "POST",
      token: alice.token,
      body: { type: "direct", memberEmails: [bob.email] },
    })
    // From the other side, with a differently-cased email.
    const second = await api("/api/rooms", {
      method: "POST",
      token: bob.token,
      body: { type: "direct", memberEmails: [alice.email.toUpperCase()] },
    })
    expect(second.status).toBe(200)
    expect(second.json.created).toBe(false)
    expect(second.json.room.id).toBe(first.json.room.id)
  })

  it("rejects an unknown member email with 400", async () => {
    const alice = await register("alice")
    const res = await api("/api/rooms", {
      method: "POST",
      token: alice.token,
      body: { type: "direct", memberEmails: [uniqueEmail("nobody")] },
    })
    expect(res.status).toBe(400)
  })

  it("rejects a group without a name with 400", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const res = await api("/api/rooms", {
      method: "POST",
      token: alice.token,
      body: { type: "group", memberEmails: [bob.email] },
    })
    expect(res.status).toBe(400)
  })
})

describe("message history", () => {
  async function roomWithMessages(createdAt: string[]) {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)
    // Explicit microsecond timestamps: several messages share the same millisecond,
    // which a millisecond-precision cursor would skip. Sent as text: postgres.js
    // serializes timestamptz parameters through Date, which drops microseconds.
    for (const [i, at] of createdAt.entries()) {
      await sql`
        insert into messages (room_id, author_id, body, created_at)
        values (${room.id}, ${alice.user.id}, ${`m${i}`}, ${at}::text::timestamptz)
      `
    }
    return { alice, bob, room }
  }

  it("returns messages newest first", async () => {
    const { alice, room } = await roomWithMessages([
      "2026-01-01T10:00:00.000Z",
      "2026-01-01T10:00:01.000Z",
      "2026-01-01T10:00:02.000Z",
    ])
    const res = await api(`/api/rooms/${room.id}/messages`, { token: alice.token })
    expect(res.status).toBe(200)
    expect(res.json.messages.map((m: { body: string }) => m.body)).toEqual(["m2", "m1", "m0"])
    expect(res.json.nextCursor).toBeNull()
  })

  it("paginates with nextCursor without skipping messages in the same millisecond", async () => {
    const createdAt = [
      "2026-01-01T10:00:00.000000Z",
      "2026-01-01T10:00:00.123100Z",
      "2026-01-01T10:00:00.123200Z",
      "2026-01-01T10:00:00.123300Z",
      "2026-01-01T10:00:00.123400Z",
      "2026-01-01T10:00:00.123500Z",
      "2026-01-01T10:00:01.000000Z",
    ]
    const { bob, room } = await roomWithMessages(createdAt)

    const bodies: string[] = []
    let cursor: string | null = null
    for (let page = 0; page < 10; page++) {
      const query: string = cursor ? `?limit=2&before=${cursor}` : "?limit=2"
      const res = await api(`/api/rooms/${room.id}/messages${query}`, { token: bob.token })
      expect(res.status).toBe(200)
      expect(res.json.messages.length).toBeLessThanOrEqual(2)
      bodies.push(...res.json.messages.map((m: { body: string }) => m.body))
      cursor = res.json.nextCursor
      if (!cursor) break
    }
    expect(cursor).toBeNull()
    expect(bodies).toEqual(["m6", "m5", "m4", "m3", "m2", "m1", "m0"])
  })

  it("returns 404 to non-members", async () => {
    const { room } = await roomWithMessages(["2026-01-01T10:00:00.000Z"])
    const stranger = await register("stranger")
    const res = await api(`/api/rooms/${room.id}/messages`, { token: stranger.token })
    expect(res.status).toBe(404)
  })
})
