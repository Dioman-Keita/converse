import { and, desc, eq, sql } from "drizzle-orm"
import { HTTPError, defineHandler, getQuery, getRouterParam } from "nitro/h3"

import { db, schema } from "../../../db/client"
import { toMessageDto } from "../../../utils/messages"
import { badRequest, requireUser } from "../../../utils/http"
import { UUID_RE, isRoomMember } from "../../../utils/rooms"

/**
 * Message history, newest first.
 * Paginate with `?before=<nextCursor>&limit=50`; `nextCursor` is null on the last page.
 *
 * The cursor is a message id, not a timestamp: Postgres stores microseconds but
 * JS dates only keep milliseconds, so a timestamp cursor would skip messages.
 */
export default defineHandler(async (event) => {
  const user = await requireUser(event)
  const roomId = getRouterParam(event, "id") ?? ""
  if (!UUID_RE.test(roomId)) throw badRequest("Invalid room id")
  if (!(await isRoomMember(roomId, user.id))) {
    throw new HTTPError({ status: 404, message: "Room not found" })
  }

  const query = getQuery(event)
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200)
  const before = typeof query.before === "string" ? query.before : undefined
  if (before !== undefined && !UUID_RE.test(before)) throw badRequest("Invalid before")

  const m = schema.messages
  const rows = await db
    .select()
    .from(m)
    .where(
      and(
        eq(m.roomId, roomId),
        before
          ? sql`(${m.createdAt}, ${m.id}) < (
              select c.created_at, c.id from ${m} c
              where c.id = ${before} and c.room_id = ${roomId}
            )`
          : undefined,
      ),
    )
    .orderBy(desc(m.createdAt), desc(m.id))
    .limit(limit)

  return {
    messages: rows.map(toMessageDto),
    nextCursor: rows.length === limit ? rows[rows.length - 1].id : null,
  }
})
