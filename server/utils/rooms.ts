import { and, eq } from "drizzle-orm"

import { db, schema } from "../db/client"

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

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
