import { randomBytes } from "node:crypto"
import { describe, expect, it } from "vitest"

import { api, baseUrl, bearer, connect, createDirectRoom, isType, register } from "./helpers"
import type { Account } from "./helpers"

async function send(
  account: Account | undefined,
  roomId: string,
  body: Uint8Array,
  { name, type = "application/pdf", clientId }: { name?: string; type?: string; clientId?: string } = {},
) {
  const query = clientId ? `?clientId=${clientId}` : ""
  const res = await fetch(`${baseUrl}/api/rooms/${roomId}/files${query}`, {
    method: "POST",
    headers: {
      ...(account ? bearer(account) : {}),
      "content-type": type,
      ...(name !== undefined ? { "x-file-name": encodeURIComponent(name) } : {}),
    },
    body: new Uint8Array(body),
  })
  const json: any = await res.json().catch(() => undefined)
  return { status: res.status, json }
}

describe("documents", () => {
  it("stores a document as-is, broadcasts it and serves it back byte for byte", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)
    const bobWs = await connect(bearer(bob))
    await bobWs.next(isType("ready"))
    bobWs.send({ type: "subscribe", roomId: room.id })
    await bobWs.next(isType("subscribed"))

    const content = randomBytes(300_000)
    const res = await send(alice, room.id, content, { name: "Rapport d'été 2026.pdf", clientId: "f1" })
    expect(res.status).toBe(200)
    expect(res.json.message).toMatchObject({
      kind: "file",
      body: "",
      file: { name: "Rapport d'été 2026.pdf", size: 300_000, mime: "application/pdf" },
    })

    const live = await bobWs.next(isType("message"))
    expect(live).toMatchObject({ clientId: "f1", message: { id: res.json.message.id } })
    bobWs.close()

    const download = await fetch(baseUrl + res.json.message.file.url, { headers: bearer(bob) })
    expect(download.status).toBe(200)
    expect(download.headers.get("content-type")).toBe("application/octet-stream")
    expect(download.headers.get("x-content-type-options")).toBe("nosniff")
    const disposition = download.headers.get("content-disposition") ?? ""
    expect(disposition).toMatch(/^attachment; /)
    expect(disposition).toContain(`filename*=UTF-8''${encodeURIComponent("Rapport d'été 2026.pdf")}`)
    expect(Buffer.from(await download.arrayBuffer()).equals(content)).toBe(true)

    const history = await api(`/api/rooms/${room.id}/messages`, { token: bob.token })
    expect(history.json.messages[0]).toMatchObject({ kind: "file", file: { size: 300_000 } })
  })

  it("never lets an HTML or SVG document render in the app", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)
    const html = new TextEncoder().encode("<script>alert(document.cookie)</script>")

    for (const [name, type] of [["page.html", "text/html"], ["logo.svg", "image/svg+xml"]]) {
      const { json } = await send(alice, room.id, html, { name, type })
      const res = await fetch(baseUrl + json.message.file.url, { headers: bearer(bob) })
      expect(res.headers.get("content-type")).toBe("application/octet-stream")
      expect(res.headers.get("content-disposition")).toMatch(/^attachment; /)
    }
  })

  it("cleans up hostile or missing file names", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)
    const bytes = new TextEncoder().encode("x")

    const traversal = await send(alice, room.id, bytes, { name: "../../etc/passwd" })
    expect(traversal.json.message.file.name).toBe("passwd")
    const windows = await send(alice, room.id, bytes, { name: "C:\\Users\\me\\notes.txt" })
    expect(windows.json.message.file.name).toBe("notes.txt")
    const control = await send(alice, room.id, bytes, { name: "bad\u0000na\nme.txt" })
    expect(control.json.message.file.name).toBe("badname.txt")
    const missing = await send(alice, room.id, bytes, {})
    expect(missing.json.message.file.name).toBe("file")
    const long = await send(alice, room.id, bytes, { name: `${"a".repeat(300)}.docx` })
    expect(long.json.message.file.name).toHaveLength(200)
    expect(long.json.message.file.name.endsWith(".docx")).toBe(true)
    const odd = await send(alice, room.id, bytes, { name: "x.bin", type: "not a mime" })
    expect(odd.json.message.file.mime).toBe("application/octet-stream")
  })

  it("rejects empty and oversized uploads", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const room = await createDirectRoom(alice, bob)
    expect((await send(alice, room.id, new Uint8Array(), { name: "empty.txt" })).status).toBe(400)

    const declaredTooBig = await fetch(`${baseUrl}/api/rooms/${room.id}/files`, {
      method: "POST",
      headers: { ...bearer(alice), "content-type": "application/zip", "content-length": String(96 * 1024 * 1024) },
      body: new Uint8Array(10),
      // @ts-expect-error Node's fetch needs this to send a body with a custom content-length.
      duplex: "half",
    }).catch(() => undefined)
    // Either refused with 413, or the connection is cut because the declared length lies.
    if (declaredTooBig) expect(declaredTooBig.status).toBe(413)
  })

  it("keeps documents private to the room", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    const eve = await register("eve")
    const room = await createDirectRoom(alice, bob)
    const { json } = await send(alice, room.id, new TextEncoder().encode("secret"), { name: "secret.txt" })

    expect((await fetch(baseUrl + json.message.file.url, { headers: bearer(eve) })).status).toBe(404)
    expect((await fetch(baseUrl + json.message.file.url)).status).toBe(401)
    expect((await send(eve, room.id, new TextEncoder().encode("x"), { name: "x.txt" })).status).toBe(404)
    expect((await send(undefined, room.id, new TextEncoder().encode("x"), { name: "x.txt" })).status).toBe(401)
  })
})
