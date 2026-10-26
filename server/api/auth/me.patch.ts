import { eq } from "drizzle-orm"
import { defineHandler } from "nitro/h3"

import { db, schema } from "../../db/client"
import { readJsonObject, requireString, requireUser } from "../../utils/http"
import { isLocale, localizedError } from "../../utils/i18n"

/**
 * Update the signed-in user's settings. Body: { name?, locale? } — only the
 * fields present are changed. Returns the updated user.
 */
export default defineHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readJsonObject(event)

  const changes: { name?: string; locale?: "en" | "fr" } = {}
  if ("name" in body) changes.name = requireString(event, body, "name", { max: 80 })
  if ("locale" in body) {
    if (!isLocale(body.locale)) throw localizedError(event, 400, "invalidLocale")
    changes.locale = body.locale
  }
  if (Object.keys(changes).length === 0) return { user }

  const [updated] = await db
    .update(schema.users)
    .set(changes)
    .where(eq(schema.users.id, user.id))
    .returning({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      imageUrl: schema.users.imageUrl,
      createdAt: schema.users.createdAt,
      locale: schema.users.locale,
    })
  return { user: updated }
})
