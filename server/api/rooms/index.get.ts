import { desc, eq, sql } from "drizzle-orm"
import { defineHandler } from "nitro/h3"

import { db, schema } from "../../db/client"
import { requireUser } from "../../utils/http"

/** Rooms the current user belongs to, most recently active first. */
export default defineHandler(async (event) => {
  const user = await requireUser(event)

  const rooms = await db
    .select({
      id: schema.rooms.id,
      name: schema.rooms.name,
      type: schema.rooms.type,
      lastMessageAt: schema.rooms.lastMessageAt,
      memberIds: sql<string[]>`(
        select array_agg(m.user_id) from ${schema.roomMembers} m
        where m.room_id = ${schema.rooms.id}
      )`,
    })
    .from(schema.roomMembers)
    .innerJoin(schema.rooms, eq(schema.rooms.id, schema.roomMembers.roomId))
    .where(eq(schema.roomMembers.userId, user.id))
    .orderBy(
      desc(sql`coalesce(${schema.rooms.lastMessageAt}, ${schema.rooms.createdAt})`),
    )

  return { rooms }
})
