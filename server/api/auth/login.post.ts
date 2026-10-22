import { eq } from "drizzle-orm"
import { HTTPError, defineHandler } from "nitro/h3"

import { db, schema } from "../../db/client"
import { createSession, verifyPassword } from "../../utils/auth"
import { readJsonObject, requireString, setSessionCookie } from "../../utils/http"

export default defineHandler(async (event) => {
  const body = await readJsonObject(event)
  const email = requireString(body, "email", { max: 254 }).toLowerCase()
  const password = requireString(body, "password", { max: 200 })

  const [row] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)

  if (!row || !(await verifyPassword(password, row.passwordHash))) {
    throw new HTTPError({ status: 401, message: "Invalid email or password" })
  }

  const token = await createSession(row.id)
  setSessionCookie(event, token)

  const { passwordHash: _, ...user } = row
  return { user, token }
})
