import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import sharp from "sharp"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { api, baseUrl, bearer, connect, createDirectRoom, isType, register } from "./helpers"
import type { Account } from "./helpers"

async function upload(account: Account | undefined, roomId: string, body: Uint8Array, type: string, clientId?: string) {
  const query = clientId ? `?clientId=${clientId}` : ""
  const res = await fetch(`${baseUrl}/api/rooms/${roomId}/media${query}`, {
    method: "POST",
    headers: { ...(account ? bearer(account) : {}), "content-type": type },
    // Copy into a plain ArrayBuffer-backed view (what fetch's BodyInit accepts).
    body: new Uint8Array(body),
  })
  const json: any = await res.json().catch(() => undefined)
  return { status: res.status, json }
}

async function download(account: Account, path: string, headers: Record<string, string> = {}) {
  const res = await fetch(baseUrl + path, { headers: { ...bearer(account), ...headers } })
  return { res, bytes: new Uint8Array(await res.arrayBuffer()) }
}

const photo = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: "#4060a0" } }).jpeg().toBuffer()

describe("photo messages", () => {
  it("re-encodes a photo as WebP, scaled to 2048 px, and broadcasts it", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)
    const bobWs = await connect(bearer(bob))
    await bobWs.next(isType("ready"))
    bobWs.send({ type: "subscribe", roomId: room.id })
    await bobWs.next(isType("subscribed"))

    const res = await upload(alice, room.id, await photo(3000, 2000), "image/jpeg", "p1")
    expect(res.status).toBe(200)
    expect(res.json.message).toMatchObject({
      kind: "image",
      body: "",
      image: { width: 2048, height: 1365, url: `/api/media/${res.json.message.id}` },
    })

    const live = await bobWs.next(isType("message"))
    expect(live).toMatchObject({ clientId: "p1", message: { id: res.json.message.id } })
    bobWs.close()

    const { res: file, bytes } = await download(bob, res.json.message.image.url)
    expect(file.status).toBe(200)
    expect(file.headers.get("content-type")).toBe("image/webp")
    expect(file.headers.get("x-content-type-options")).toBe("nosniff")
    const meta = await sharp(bytes).metadata()
    expect(meta).toMatchObject({ format: "webp", width: 2048, height: 1365 })
  })

  it("turns phone photos upright and strips EXIF / GPS metadata", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)
    // Stored landscape (400×200) with "rotate 90°" in EXIF, plus a GPS position.
    const input = await sharp({ create: { width: 400, height: 200, channels: 3, background: "#000" } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .withExif({ IFD0: { Make: "PhoneMaker" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "48/1 51/1 0/1" } })
      .toBuffer()
    expect((await sharp(input).metadata()).exif).toBeDefined()

    const res = await upload(alice, room.id, input, "image/jpeg")
    expect(res.json.message.image).toMatchObject({ width: 200, height: 400 })
    const { bytes } = await download(alice, res.json.message.image.url)
    const meta = await sharp(bytes).metadata()
    expect(meta).toMatchObject({ width: 200, height: 400 })
    expect(meta.exif).toBeUndefined()
    expect(meta.orientation).toBeUndefined()
  })

  it("keeps transparency and GIF animation", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)

    const png = await sharp({ create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .png()
      .toBuffer()
    const pngRes = await upload(alice, room.id, png, "image/png")
    expect((await sharp((await download(alice, pngRes.json.message.image.url)).bytes).metadata()).hasAlpha).toBe(true)

    const frames = await Promise.all(
      ["#f00", "#0f0", "#00f"].map((background) =>
        sharp({ create: { width: 32, height: 32, channels: 3, background } }).raw().toBuffer(),
      ),
    )
    const gif = await sharp(Buffer.concat(frames), { raw: { width: 32, height: 96, channels: 3, pageHeight: 32 } })
      .gif()
      .toBuffer()
    const gifRes = await upload(alice, room.id, gif, "image/gif")
    expect(gifRes.json.message.image).toMatchObject({ width: 32, height: 32 })
    const animated = await sharp((await download(alice, gifRes.json.message.image.url)).bytes, { animated: true }).metadata()
    expect(animated.pages).toBe(3)
  })

  it("rejects SVG, non-media, unreadable and empty uploads", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')

    expect((await upload(alice, room.id, svg, "image/svg+xml")).status).toBe(415)
    expect((await upload(alice, room.id, svg, "text/plain")).status).toBe(415)
    expect((await upload(alice, room.id, new TextEncoder().encode("not a photo"), "image/jpeg")).status).toBe(400)
    expect((await upload(alice, room.id, new Uint8Array(), "image/jpeg")).status).toBe(400)

    const history = await api(`/api/rooms/${room.id}/messages`, { token: alice.token })
    expect(history.json.messages).toHaveLength(0)
  })

  it("keeps photos private to the room", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const eve = await register("eve")
    const room = await createDirectRoom(alice, bob)
    const { json } = await upload(alice, room.id, await photo(100, 100), "image/jpeg")

    expect((await download(eve, json.message.image.url)).res.status).toBe(404)
    expect((await fetch(baseUrl + json.message.image.url)).status).toBe(401)
    expect((await upload(eve, room.id, await photo(10, 10), "image/jpeg")).status).toBe(404)
    expect((await upload(undefined, room.id, await photo(10, 10), "image/jpeg")).status).toBe(401)

    const history = await api(`/api/rooms/${room.id}/messages`, { token: bob.token })
    expect(history.json.messages[0]).toMatchObject({ kind: "image", image: { width: 100, height: 100 } })
  })
})

// Video conversion needs ffmpeg (installed in CI and in the Docker image).
const hasFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0

describe.skipIf(!hasFfmpeg)("video messages", () => {
  let dir: string
  let clip: Uint8Array

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "converse-video-"))
    const out = join(dir, "clip.webm")
    // 2 s of test pattern + tone, 1920×1080, in a container browsers record (WebM/VP8).
    const res = spawnSync("ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y",
      "-f", "lavfi", "-i", "testsrc=size=1920x1080:rate=25:duration=2",
      "-f", "lavfi", "-i", "sine=frequency=440:duration=2",
      "-c:v", "libvpx", "-b:v", "1M", "-c:a", "libopus", "-shortest", out,
    ])
    if (res.status !== 0) throw new Error(`fixture failed: ${String(res.stderr)}`)
    clip = readFileSync(out)
  })
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it("posts a processing video, then broadcasts it converted to H.264 with a poster", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)
    const bobWs = await connect(bearer(bob))
    await bobWs.next(isType("ready"))
    bobWs.send({ type: "subscribe", roomId: room.id })
    await bobWs.next(isType("subscribed"))

    const res = await upload(alice, room.id, clip, "video/webm", "v1")
    expect(res.status).toBe(200)
    expect(res.json.message).toMatchObject({ kind: "video", video: { status: "processing" } })
    const id = res.json.message.id

    const first = await bobWs.next(isType("message"))
    expect(first.message.video.status).toBe("processing")
    const ready = await bobWs.next((e) => e.type === "message" && e.message.id === id, 60_000)
    bobWs.close()
    expect(ready.message.video).toMatchObject({
      status: "ready",
      url: `/api/media/${id}`,
      posterUrl: `/api/media/${id}/poster`,
      width: 1280,
      height: 720,
    })
    expect(ready.message.video.durationMs).toBeGreaterThan(1800)

    const video = await download(bob, ready.message.video.url, { range: "bytes=0-31" })
    expect(video.res.status).toBe(206)
    expect(video.res.headers.get("content-type")).toBe("video/mp4")
    expect(new TextDecoder().decode(video.bytes.slice(4, 8))).toBe("ftyp")

    const poster = await download(bob, ready.message.video.posterUrl)
    expect(poster.res.headers.get("content-type")).toBe("image/jpeg")
    expect((await sharp(poster.bytes).metadata()).width).toBe(640)

    const history = await api(`/api/rooms/${room.id}/messages`, { token: bob.token })
    expect(history.json.messages[0].video.status).toBe("ready")
  }, 90_000)

  it("rejects an unreadable video", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)
    const res = await upload(alice, room.id, new TextEncoder().encode("nope".repeat(100)), "video/mp4")
    expect(res.status).toBe(400)
  })
})
