import { defineHandler } from "nitro/h3"

import { db, schema } from "../../db/client"
import { createSession, hashPassword } from "../../utils/auth"
import { readJsonObject, requireString, setSessionCookie } from "../../utils/http"
import { isLocale, localizedError } from "../../utils/i18n"

export default defineHandler(async (event) => {
  const body = await readJsonObject(event)
  const name = requireString(event, body, "name", { max: 80 })
  const email = requireString(event, body, "email", { max: 254 }).toLowerCase()
  const password = requireString(event, body, "password", { min: 8, max: 200 })
  // The language the person signed up in (the app's current one); English otherwise.
  const locale = isLocale(body.locale) ? body.locale : "en"

  // Rely on the unique constraint (not a pre-check) so concurrent sign-ups can't race.
  const inserted = await db
    .insert(schema.users)
    .values({ name, email, passwordHash: await hashPassword(password), locale })
    .onConflictDoNothing({ target: schema.users.email })
    .returning({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      imageUrl: schema.users.imageUrl,
      createdAt: schema.users.createdAt,
      locale: schema.users.locale,
    })
  const user = inserted.at(0)
  if (!user) {
    throw localizedError(event, 409, "emailTaken")
  }

  const token = await createSession(user.id)
  setSessionCookie(event, token)
  // Token is returned for non-browser clients (Android) that use `Authorization: Bearer`.
  return { user, token }
})
