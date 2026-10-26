import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import { Readable } from "node:stream"
import { and, eq } from "drizzle-orm"
import { defineHandler, getRouterParam } from "nitro/h3"

import { db, schema } from "../../db/client"
import { requireUser } from "../../utils/http"
import { localizedError } from "../../utils/i18n"
import { UUID_RE } from "../../utils/rooms"
import { mediaFile } from "../../utils/voice"

/**
 * Audio of a voice message, for members of its room only.
 * Supports HTTP Range requests: Safari (iOS) refuses to play audio without them,
 * and they let players seek without downloading the whole file.
 */
export default defineHandler(async (event) => {
  const user = await requireUser(event)
  const messageId = getRouterParam(event, "id") ?? ""
  const notFound = () => localizedError(event, 404, "mediaNotFound")
  if (!UUID_RE.test(messageId)) throw notFound()

  const rows = await db
    .select({ mediaPath: schema.messages.mediaPath })
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
  // Same answer for "doesn't exist" and "not yours": no probing of other rooms.
  if (!row?.mediaPath) throw notFound()

  const file = mediaFile(row.mediaPath)
  const size = await stat(file).then((s) => s.size, () => undefined)
  if (size === undefined) throw notFound()

  const headers: Record<string, string> = {
    "content-type": "audio/mp4",
    "accept-ranges": "bytes",
    // A message's audio never changes.
    "cache-control": "private, max-age=31536000, immutable",
  }

  const range = parseRange(event.req.headers.get("range"), size)
  if (range === "invalid") {
    return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } })
  }
  const { start, end } = range ?? { start: 0, end: size - 1 }
  headers["content-length"] = String(end - start + 1)
  if (range) headers["content-range"] = `bytes ${start}-${end}/${size}`

  const body = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream
  return new Response(body, { status: range ? 206 : 200, headers })
})

/** Single `bytes=` range (what audio players send); undefined = whole file. */
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
