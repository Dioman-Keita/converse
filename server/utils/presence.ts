import { eq, sql } from "drizzle-orm"

import { db, schema } from "../db/client"
import { notifyUsers } from "./hub"

/** Users who share at least one room with `userId` — the only ones who see their presence. */
async function contactsOf(userId: string): Promise<string[]> {
  const rows = await db.execute<{ user_id: string }>(sql`
    select distinct m.user_id from ${schema.roomMembers} m
    where m.room_id in (select room_id from ${schema.roomMembers} where user_id = ${userId})
      and m.user_id <> ${userId}
  `)
  return rows.map((r) => r.user_id)
}

/**
 * Records the transition and tells the user's contacts.
 * `last_seen_at` is stamped on both edges so it stays meaningful even if the
 * server stops without seeing the disconnect.
 */
export async function announcePresence(userId: string, online: boolean): Promise<void> {
  const lastSeenAt = new Date()
  await db.update(schema.users).set({ lastSeenAt }).where(eq(schema.users.id, userId))
  notifyUsers(await contactsOf(userId), {
    type: "presence",
    userId,
    online,
    lastSeenAt: lastSeenAt.toISOString(),
  })
}
