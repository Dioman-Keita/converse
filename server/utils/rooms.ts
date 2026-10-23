import { and, desc, eq, inArray, sql } from "drizzle-orm"

import { db, schema } from "../db/client"
import type { RoomDto, RoomMemberDto } from "./hub"

export async function isRoomMember(
  roomId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ roomId: schema.roomMembers.roomId })
    .from(schema.roomMembers)
    .where(
      and(
        eq(schema.roomMembers.roomId, roomId),
        eq(schema.roomMembers.userId, userId),
      ),
    )
    .limit(1)
  return Boolean(row)
}

/** Rooms of `userId` (optionally restricted to `roomIds`), most recently active first. */
export async function listRooms(
  userId: string,
  roomIds?: string[],
): Promise<RoomDto[]> {
  const r = schema.rooms
  const rows = await db
    .select({
      id: r.id,
      name: r.name,
      type: r.type,
      createdAt: r.createdAt,
      lastMessageAt: r.lastMessageAt,
      members: sql<RoomMemberDto[]>`(
        select coalesce(json_agg(json_build_object('id', u.id, 'name', u.name, 'email', u.email) order by u.name), '[]'::json)
        from ${schema.roomMembers} m join ${schema.users} u on u.id = m.user_id
        where m.room_id = ${r.id}
      )`,
    })
    .from(schema.roomMembers)
    .innerJoin(r, eq(r.id, schema.roomMembers.roomId))
    .where(
      and(
        eq(schema.roomMembers.userId, userId),
        roomIds ? inArray(r.id, roomIds) : undefined,
      ),
    )
    .orderBy(desc(sql`coalesce(${r.lastMessageAt}, ${r.createdAt})`))

  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
  }))
}

/** The existing direct room between two users, if any. */
export async function findDirectRoom(
  userA: string,
  userB: string,
): Promise<string | undefined> {
  const rows = await db
    .select({ id: schema.rooms.id })
    .from(schema.rooms)
    .where(
      and(
        eq(schema.rooms.type, "direct"),
        sql`${schema.rooms.id} in (select room_id from ${schema.roomMembers} where user_id = ${userA})`,
        sql`${schema.rooms.id} in (select room_id from ${schema.roomMembers} where user_id = ${userB})`,
      ),
    )
    .limit(1)
  return rows.at(0)?.id
}

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
