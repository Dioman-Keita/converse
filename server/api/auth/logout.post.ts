import { defineHandler } from "nitro/h3"

import { deleteSession } from "../../utils/auth"
import { clearSessionCookie, getRequestToken } from "../../utils/http"

export default defineHandler(async (event) => {
  const token = getRequestToken(event)
  if (token) await deleteSession(token)
  clearSessionCookie(event)
  return { ok: true }
})
