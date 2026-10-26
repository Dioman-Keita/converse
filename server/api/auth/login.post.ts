import { eq } from "drizzle-orm"
import { defineHandler } from "nitro/h3"

import { db, schema } from "../../db/client"
import { createSession, hashPassword, verifyPassword } from "../../utils/auth"
import { readJsonObject, requireString, setSessionCookie } from "../../utils/http"
import { localizedError } from "../../utils/i18n"

const dummyHash = hashPassword("converse-timing-equalizer")

export default defineHandler(async (event) => {
  const body = await readJsonObject(event)
  const email = requireString(event, body, "email", { max: 254 }).toLowerCase()
  const password = requireString(event, body, "password", { max: 200 })

  const row = (
    await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1)
  ).at(0)

  // Always run scrypt, even for unknown emails, so response time doesn't reveal accounts.
  const valid = await verifyPassword(password, row?.passwordHash ?? (await dummyHash))
  if (!row || !valid) {
    throw localizedError(event, 401, "invalidCredentials")
  }

  const token = await createSession(row.id)
  setSessionCookie(event, token)

  const { passwordHash: _, ...user } = row
  return { user, token }
})
