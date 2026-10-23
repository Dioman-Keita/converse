import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { api, baseUrl, bearer, connect, createDirectRoom, isType, register } from "./helpers"
import type { Account } from "./helpers"

// The server converts voice notes with ffmpeg; without it (e.g. a dev machine) skip.
const hasFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0

/** Synthesizes a tone in the given container, like a browser's MediaRecorder would. */
function tone(dir: string, file: string, seconds: number, codecArgs: string[]): Uint8Array {
  const out = join(dir, file)
  const res = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "lavfi", "-i", `sine=frequency=440:duration=${seconds}`,
    ...codecArgs, out,
  ])
  if (res.status !== 0) throw new Error(`ffmpeg fixture failed: ${String(res.stderr)}`)
  return readFileSync(out)
}

async function upload(account: Account, roomId: string, body: Uint8Array, type: string, clientId?: string) {
  const query = clientId ? `?clientId=${clientId}` : ""
  const res = await fetch(`${baseUrl}/api/rooms/${roomId}/voice${query}`, {
    method: "POST",
    headers: { ...bearer(account), "content-type": type },
    // Copy into a plain ArrayBuffer-backed view (what fetch's BodyInit accepts).
    body: new Uint8Array(body),
  })
  const json: any = await res.json().catch(() => undefined)
  return { status: res.status, json }
}

describe.skipIf(!hasFfmpeg)("voice messages", () => {
  let dir: string
  let webm: Uint8Array // Chrome / Android
  let mp4: Uint8Array // Safari / iOS

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "converse-voice-"))
    webm = tone(dir, "note.webm", 2, ["-c:a", "libopus"])
    mp4 = tone(dir, "note.m4a", 2, ["-c:a", "aac", "-f", "mp4"])
  })
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it("accepts a WebM/Opus note, stores it as AAC and broadcasts it", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)
    const bobWs = await connect(bearer(bob))
    await bobWs.next(isType("ready"))
    bobWs.send({ type: "subscribe", roomId: room.id })
    await bobWs.next(isType("subscribed"))

    const res = await upload(alice, room.id, webm, "audio/webm;codecs=opus", "v1")
    expect(res.status).toBe(200)
    expect(res.json.message).toMatchObject({ kind: "voice", body: "", authorId: alice.user.id })
    expect(res.json.message.voice.durationMs).toBeGreaterThan(1800)
    expect(res.json.message.voice.durationMs).toBeLessThan(2300)
    expect(res.json.message.voice.url).toBe(`/api/media/${res.json.message.id}`)

    const live = await bobWs.next(isType("message"))
    expect(live.message.id).toBe(res.json.message.id)
    expect(live.clientId).toBe("v1")
    bobWs.close()

    // Bob downloads it: converted to MP4/AAC ("ftyp" box at offset 4).
    const audio = await fetch(baseUrl + res.json.message.voice.url, { headers: bearer(bob) })
    expect(audio.status).toBe(200)
    expect(audio.headers.get("content-type")).toBe("audio/mp4")
    const bytes = new Uint8Array(await audio.arrayBuffer())
    expect(new TextDecoder().decode(bytes.slice(4, 8))).toBe("ftyp")
  })

  it("accepts a Safari-style MP4/AAC note", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)
    const res = await upload(alice, room.id, mp4, "audio/mp4")
    expect(res.status).toBe(200)
    expect(res.json.message.kind).toBe("voice")
  })

  it("serves byte ranges (required by iOS Safari)", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)
    const { json } = await upload(alice, room.id, webm, "audio/webm")
    const url = baseUrl + json.message.voice.url

    const full = await fetch(url, { headers: bearer(bob) })
    const size = Number(full.headers.get("content-length"))
    expect(full.headers.get("accept-ranges")).toBe("bytes")

    const part = await fetch(url, { headers: { ...bearer(bob), range: "bytes=0-99" } })
    expect(part.status).toBe(206)
    expect(part.headers.get("content-range")).toBe(`bytes 0-99/${size}`)
    expect((await part.arrayBuffer()).byteLength).toBe(100)

    const tail = await fetch(url, { headers: { ...bearer(bob), range: "bytes=-10" } })
    expect(tail.status).toBe(206)
    expect((await tail.arrayBuffer()).byteLength).toBe(10)

    const beyond = await fetch(url, { headers: { ...bearer(bob), range: `bytes=${size}-` } })
    expect(beyond.status).toBe(416)
  })

  it("lists voice notes in the history", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)
    const { json } = await upload(alice, room.id, webm, "audio/webm")
    const history = await api(`/api/rooms/${room.id}/messages`, { token: bob.token })
    expect(history.json.messages[0]).toMatchObject({
      id: json.message.id,
      kind: "voice",
      voice: { url: json.message.voice.url },
    })
  })

  it("hides the audio from non-members and anonymous users", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const eve = await register("eve")
    const room = await createDirectRoom(alice, bob)
    const { json } = await upload(alice, room.id, webm, "audio/webm")
    const url = baseUrl + json.message.voice.url

    expect((await fetch(url, { headers: bearer(eve) })).status).toBe(404)
    expect((await fetch(url)).status).toBe(401)
    expect((await upload(eve, room.id, webm, "audio/webm")).status).toBe(404)
  })

  it("rejects unreadable, too short and non-audio uploads", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)

    const garbage = new TextEncoder().encode("definitely not audio".repeat(50))
    expect((await upload(alice, room.id, garbage, "audio/webm")).status).toBe(400)

    const blip = tone(dir, "blip.webm", 0.1, ["-c:a", "libopus"])
    expect((await upload(alice, room.id, blip, "audio/webm")).status).toBe(400)

    expect((await upload(alice, room.id, webm, "text/plain")).status).toBe(415)

    // Nothing was posted by the rejected uploads.
    const history = await api(`/api/rooms/${room.id}/messages`, { token: alice.token })
    expect(history.json.messages).toHaveLength(0)
  })
})
