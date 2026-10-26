import { defineHandler, getRouterParam } from "nitro/h3"

import { MAX_MESSAGE_LENGTH, postMessage } from "../../../utils/messages"
import {
  badRequest,
  readJsonObject,
  requireString,
  requireUser,
} from "../../../utils/http"
import { localizedError } from "../../../utils/i18n"
import { UUID_RE, isRoomMember } from "../../../utils/rooms"

/** HTTP fallback for sending (e.g. Android while the socket reconnects). */
export default defineHandler(async (event) => {
  const user = await requireUser(event)
  const roomId = getRouterParam(event, "id") ?? ""
  if (!UUID_RE.test(roomId)) throw badRequest("Invalid room id")
  if (!(await isRoomMember(roomId, user.id))) {
    throw localizedError(event, 404, "roomNotFound")
  }

  const body = await readJsonObject(event)
  const text = requireString(event, body, "body", { max: MAX_MESSAGE_LENGTH })
  const clientId = typeof body.clientId === "string" ? body.clientId : undefined

  return { message: await postMessage(roomId, user.id, { kind: "text", body: text }, clientId) }
})
