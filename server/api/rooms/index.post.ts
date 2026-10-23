import { inArray } from "drizzle-orm"
import { defineHandler } from "nitro/h3"

import { db, schema } from "../../db/client"
import { notifyUsers } from "../../utils/hub"
import {
  badRequest,
  readJsonObject,
  requireString,
  requireUser,
} from "../../utils/http"
import { findDirectRoom, listRooms } from "../../utils/rooms"

/**
 * Creates a room with the current user plus members found by email.
 * Body: { type: "direct" | "group", memberEmails: string[], name?: string }
 * - direct: exactly one other member; an existing direct room is returned instead
 *   of creating a duplicate. Clients display the other member's name.
 * - group: `name` is required.
 * All members' open sockets receive a `room` event.
 */
export default defineHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readJsonObject(event)

  const type = body.type
  if (type !== "direct" && type !== "group") {
    throw badRequest(`"type" must be "direct" or "group"`)
  }
  const name = type === "group" ? requireString(body, "name", { max: 80 }) : ""

  const rawEmails = body.memberEmails
  if (
    !Array.isArray(rawEmails) ||
    rawEmails.length > 100 ||
    !rawEmails.every((e) => typeof e === "string")
  ) {
    throw badRequest(`"memberEmails" must be an array of strings`)
  }
  const emails = [...new Set(rawEmails.map((e) => e.trim().toLowerCase()))]

  const members = emails.length
    ? await db
        .select({ id: schema.users.id, email: schema.users.email })
        .from(schema.users)
        .where(inArray(schema.users.email, emails))
    : []

  const missing = emails.filter((e) => !members.some((m) => m.email === e))
  if (missing.length) throw badRequest(`Unknown users: ${missing.join(", ")}`)

  const memberIds = [...new Set([user.id, ...members.map((m) => m.id)])]
  if (type === "direct" && memberIds.length !== 2) {
    throw badRequest("A direct conversation needs exactly one other person")
  }

  if (type === "direct") {
    const existingId = await findDirectRoom(memberIds[0], memberIds[1])
    if (existingId) {
      const [room] = await listRooms(user.id, [existingId])
      return { room, created: false }
    }
  }

  const roomId = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(schema.rooms)
      .values({ name, type })
      .returning({ id: schema.rooms.id })
    await tx
      .insert(schema.roomMembers)
      .values(memberIds.map((userId) => ({ roomId: row.id, userId })))
    return row.id
  })

  const [room] = await listRooms(user.id, [roomId])
  notifyUsers(memberIds, { type: "room", room })
  return { room, created: true }
})
