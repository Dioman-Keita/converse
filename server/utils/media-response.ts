import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import { Readable } from "node:stream"
import { and, eq } from "drizzle-orm"
import { getRouterParam } from "nitro/h3"
import type { H3Event } from "nitro/h3"

import { db, schema } from "../db/client"
import { requireUser } from "./http"
import { localizedError } from "./i18n"
import { attachmentDisposition } from "./files"
import { mediaFile } from "./media"
import { UUID_RE } from "./rooms"

const CONTENT_TYPES = {
  voice: "audio/mp4",
  image: "image/webp",
  video: "video/mp4",
  // Documents are opaque bytes: the browser must download, never interpret, them.
  file: "application/octet-stream",
} as const

/**
 * Serves a message's media file (or its video poster) to members of its room only.
 * Same 404 for "doesn't exist" and "not yours": no probing of other rooms.
 * Supports HTTP Range requests: iOS Safari won't play audio/video without them,
 * and they let players seek without downloading the whole file.
 */
export async function serveMessageMedia(event: H3Event, variant: "file" | "poster"): Promise<Response> {
  const user = await requireUser(event)
  const messageId = getRouterParam(event, "id") ?? ""
  const notFound = () => localizedError(event, 404, "mediaNotFound")
  if (!UUID_RE.test(messageId)) throw notFound()

  const rows = await db
    .select({
      kind: schema.messages.kind,
      mediaPath: schema.messages.mediaPath,
      posterPath: schema.messages.mediaPosterPath,
      name: schema.messages.mediaName,
    })
    .from(schema.messages)
    .innerJoin(
      schema.roomMembers,
      and(
        eq(schema.roomMembers.roomId, schema.messages.roomId),
        eq(schema.roomMembers.userId, user.id),
      ),
    )
    .where(eq(schema.messages.id, messageId))
    .limit(1)
  const row = rows.at(0)
  if (!row || row.kind === "text") throw notFound()

  const path = variant === "poster" ? row.posterPath : row.mediaPath
  if (!path) throw notFound()
  const file = mediaFile(path)
  const size = await stat(file).then((s) => s.size, () => undefined)
  if (size === undefined) throw notFound()

  const headers: Record<string, string> = {
    "content-type": variant === "poster" ? "image/jpeg" : CONTENT_TYPES[row.kind],
    "x-content-type-options": "nosniff",
    "accept-ranges": "bytes",
    // A message's media never changes once ready.
    "cache-control": "private, max-age=31536000, immutable",
  }
  if (row.kind === "file") headers["content-disposition"] = attachmentDisposition(row.name ?? "file")

  const range = parseRange(event.req.headers.get("range"), size)
  if (range === "invalid") {
    return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } })
  }
  const { start, end } = range ?? { start: 0, end: size - 1 }
  headers["content-length"] = String(end - start + 1)
  if (range) headers["content-range"] = `bytes ${start}-${end}/${size}`

  const body = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream
  return new Response(body, { status: range ? 206 : 200, headers })
}

/** Single `bytes=` range (what media players send); undefined = whole file. */
function parseRange(
  header: string | null,
  size: number,
): { start: number; end: number } | "invalid" | undefined {
  if (!header) return undefined
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (!match) return undefined
  const [, from, to] = match
  let start: number
  let end: number
  if (from === "") {
    // Suffix range: last N bytes.
    const suffix = Number(to)
    if (!suffix) return "invalid"
    start = Math.max(0, size - suffix)
    end = size - 1
  } else {
    start = Number(from)
    end = to === "" ? size - 1 : Math.min(Number(to), size - 1)
  }
  if (start > end || start >= size) return "invalid"
  return { start, end }
}
