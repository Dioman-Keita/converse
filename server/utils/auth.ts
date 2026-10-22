/**
 * Password hashing + opaque session tokens.
 *
 * - Passwords: scrypt (node:crypto, no native deps).
 * - Sessions: random token given to the client (cookie for web, Bearer for Android);
 *   only its SHA-256 is stored in Postgres.
 */
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import { and, eq, gt } from "drizzle-orm"

import { db, schema } from "../db/client"

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>

export const SESSION_COOKIE = "converse_session"
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scryptAsync(password, salt, 64)
  return `${salt.toString("hex")}:${hash.toString("hex")}`
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":")
  if (!saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, "hex")
  const actual = await scryptAsync(
    password,
    Buffer.from(saltHex, "hex"),
    expected.length,
  )
  return timingSafeEqual(actual, expected)
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url")
  await db.insert(schema.sessions).values({
    id: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  })
  return token
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token)))
}

/** Reads the session token from `Authorization: Bearer` or the session cookie. */
export function readSessionToken(headers: Headers): string | undefined {
  const auth = headers.get("authorization")
  if (auth?.startsWith("Bearer ")) return auth.slice(7)

  const cookie = headers.get("cookie")
  if (!cookie) return undefined
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=")
    if (name === SESSION_COOKIE) return decodeURIComponent(rest.join("="))
  }
  return undefined
}

export async function getSessionUser(headers: Headers) {
  const token = readSessionToken(headers)
  if (!token) return undefined

  const [row] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      imageUrl: schema.users.imageUrl,
      createdAt: schema.users.createdAt,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(
      and(
        eq(schema.sessions.id, hashToken(token)),
        gt(schema.sessions.expiresAt, new Date()),
      ),
    )
    .limit(1)

  return row
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>
