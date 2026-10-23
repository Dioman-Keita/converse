import { inArray } from "drizzle-orm"
import { defineHandler } from "nitro/h3"

import { db, schema } from "../../db/client"
import {
  badRequest,
  readJsonObject,
  requireString,
  requireUser,
} from "../../utils/http"

/**
 * Creates a room with the current user plus members found by email.
 * Body: { name, type: "direct" | "group", memberEmails: string[] }
 */
export default defineHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readJsonObject(event)

  const name = requireString(body, "name", { max: 80 })
  const type = body.type
  if (type !== "direct" && type !== "group") {
    throw badRequest(`"type" must be "direct" or "group"`)
  }

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
    throw badRequest("A direct room needs exactly one other member")
  }

  const room = await db.transaction(async (tx) => {
    const [row] = await tx.insert(schema.rooms).values({ name, type }).returning()
    await tx
      .insert(schema.roomMembers)
      .values(memberIds.map((userId) => ({ roomId: row.id, userId })))
    return row
  })

  return { room: { ...room, memberIds } }
})
