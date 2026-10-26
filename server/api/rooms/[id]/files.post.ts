import { defineHandler, getQuery, getRouterParam } from "nitro/h3"

import { MAX_FILE_BYTES, sanitizeFileName, sanitizeMime, storeFile } from "../../../utils/files"
import { badRequest, requireUser } from "../../../utils/http"
import { localizedError } from "../../../utils/i18n"
import { removeMedia } from "../../../utils/media"
import { postMessage } from "../../../utils/messages"
import { UUID_RE, isRoomMember } from "../../../utils/rooms"

/**
 * Upload a document: the raw file as the request body, its name URI-encoded in
 * `X-File-Name`, its type in `Content-Type`, `?clientId=` for optimistic UI.
 */
export default defineHandler(async (event) => {
  const user = await requireUser(event)
  const roomId = getRouterParam(event, "id") ?? ""
  if (!UUID_RE.test(roomId)) throw badRequest("Invalid room id")
  if (!(await isRoomMember(roomId, user.id))) throw localizedError(event, 404, "roomNotFound")

  const tooLarge = () => localizedError(event, 413, "fileTooLarge")
  if (Number(event.req.headers.get("content-length") ?? 0) > MAX_FILE_BYTES) throw tooLarge()
  const bytes = new Uint8Array(await event.req.arrayBuffer())
  if (bytes.byteLength > MAX_FILE_BYTES) throw tooLarge()
  if (bytes.byteLength === 0) throw localizedError(event, 400, "mediaEmpty")

  const name = sanitizeFileName(event.req.headers.get("x-file-name"))
  const mime = sanitizeMime(event.req.headers.get("content-type"))
  const query = getQuery(event)
  const clientId = typeof query.clientId === "string" ? query.clientId.slice(0, 100) : undefined

  const mediaPath = await storeFile(bytes)
  try {
    const message = await postMessage(
      roomId,
      user.id,
      { kind: "file", mediaPath, mediaName: name, mediaSize: bytes.byteLength, mediaMime: mime },
      clientId,
    )
    return { message }
  } catch (error) {
    await removeMedia(mediaPath)
    throw error
  }
})
