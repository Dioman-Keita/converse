import { eq } from "drizzle-orm"
import { HTTPError, defineHandler } from "nitro/h3"

import { db, schema } from "../../db/client"
import { createSession, hashPassword } from "../../utils/auth"
import { readJsonObject, requireString, setSessionCookie } from "../../utils/http"

export default defineHandler(async (event) => {
  const body = await readJsonObject(event)
  const name = requireString(body, "name", { max: 80 })
  const email = requireString(body, "email", { max: 254 }).toLowerCase()
  const password = requireString(body, "password", { min: 8, max: 200 })

  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)
  if (existing) {
    throw new HTTPError({ status: 409, message: "Email already registered" })
  }

  const [user] = await db
    .insert(schema.users)
    .values({ name, email, passwordHash: await hashPassword(password) })
    .returning({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      imageUrl: schema.users.imageUrl,
      createdAt: schema.users.createdAt,
    })

  const token = await createSession(user.id)
  setSessionCookie(event, token)
  // Token is returned for non-browser clients (Android) that use `Authorization: Bearer`.
  return { user, token }
})
