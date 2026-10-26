import { HTTPError, deleteCookie, setCookie } from "nitro/h3"
import type { H3Event } from "nitro/h3"

import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  getSessionUser,
  readSessionToken,
} from "./auth"
import type { SessionUser } from "./auth"
import { localizedError, requestLocale, translate } from "./i18n"
import type { MessageKey } from "./i18n"

export async function requireUser(event: H3Event): Promise<SessionUser> {
  const user = await getSessionUser(event.req.headers)
  if (!user) throw localizedError(event, 401, "notAuthenticated")
  return user
}

export function getRequestToken(event: H3Event): string | undefined {
  return readSessionToken(event.req.headers)
}

export function setSessionCookie(event: H3Event, token: string) {
  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, { path: "/" })
}

export function badRequest(message: string): HTTPError {
  return new HTTPError({ status: 400, message })
}

export async function readJsonObject(
  event: H3Event,
): Promise<Record<string, unknown>> {
  const body: unknown = await event.req.json().catch(() => undefined)
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw badRequest("Expected a JSON object body")
  }
  return body as Record<string, unknown>
}

// Request fields whose validation errors are shown in the app (translated label).
const FIELD_LABELS: Record<string, MessageKey | undefined> = {
  name: "field.name",
  email: "field.email",
  password: "field.password",
  body: "field.body",
}

export function requireString(
  event: H3Event,
  body: Record<string, unknown>,
  key: string,
  { min = 1, max = 10_000 }: { min?: number; max?: number } = {},
): string {
  const value = body[key]
  if (typeof value !== "string") throw badRequest(`"${key}" must be a string`)
  const trimmed = key === "password" ? value : value.trim()
  if (trimmed.length < min || trimmed.length > max) {
    const label = FIELD_LABELS[key]
    if (!label) throw badRequest(`"${key}" must be ${min}-${max} characters`)
    const locale = requestLocale(event)
    throw new HTTPError({
      status: 400,
      message: translate(locale, "fieldLength", { field: translate(locale, label), min, max }),
    })
  }
  return trimmed
}
