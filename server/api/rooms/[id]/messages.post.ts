import { HTTPError, defineHandler, getRouterParam } from "nitro/h3"

import { MAX_MESSAGE_LENGTH, postMessage } from "../../../utils/messages"
import {
  badRequest,
  readJsonObject,
  requireString,
  requireUser,
} from "../../../utils/http"
import { UUID_RE, isRoomMember } from "../../../utils/rooms"

/** HTTP fallback for sending (e.g. Android while the socket reconnects). */
export default defineHandler(async (event) => {
  const user = await requireUser(event)
  const roomId = getRouterParam(event, "id") ?? ""
  if (!UUID_RE.test(roomId)) throw badRequest("Invalid room id")
  if (!(await isRoomMember(roomId, user.id))) {
    throw new HTTPError({ status: 404, message: "Room not found" })
  }

  const body = await readJsonObject(event)
  const text = requireString(body, "body", { max: MAX_MESSAGE_LENGTH })
  const clientId = typeof body.clientId === "string" ? body.clientId : undefined

  return { message: await postMessage(roomId, user.id, text, clientId) }
})
