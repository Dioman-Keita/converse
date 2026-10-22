import { and, desc, eq, lt } from "drizzle-orm"
import { HTTPError, defineHandler, getQuery, getRouterParam } from "nitro/h3"

import { db, schema } from "../../../db/client"
import { toMessageDto } from "../../../utils/messages"
import { badRequest, requireUser } from "../../../utils/http"
import { UUID_RE, isRoomMember } from "../../../utils/rooms"

/** Message history, newest first. Paginate with `?before=<ISO date>&limit=50`. */
export default defineHandler(async (event) => {
  const user = await requireUser(event)
  const roomId = getRouterParam(event, "id") ?? ""
  if (!UUID_RE.test(roomId)) throw badRequest("Invalid room id")
  if (!(await isRoomMember(roomId, user.id))) {
    throw new HTTPError({ status: 404, message: "Room not found" })
  }

  const query = getQuery(event)
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200)
  const before =
    typeof query.before === "string" ? new Date(query.before) : undefined
  if (before && Number.isNaN(before.getTime())) throw badRequest("Invalid before")

  const rows = await db
    .select()
    .from(schema.messages)
    .where(
      and(
        eq(schema.messages.roomId, roomId),
        before ? lt(schema.messages.createdAt, before) : undefined,
      ),
    )
    .orderBy(desc(schema.messages.createdAt))
    .limit(limit)

  return { messages: rows.map(toMessageDto) }
})
