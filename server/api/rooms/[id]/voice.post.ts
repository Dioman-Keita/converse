import { rm } from "node:fs/promises"
import { HTTPError, defineHandler, getQuery, getRouterParam } from "nitro/h3"

import { postMessage } from "../../../utils/messages"
import { badRequest, requireUser } from "../../../utils/http"
import { UUID_RE, isRoomMember } from "../../../utils/rooms"
import { MAX_VOICE_BYTES, VoiceError, mediaFile, storeVoice } from "../../../utils/voice"

/**
 * Upload a voice note: raw audio as the request body (whatever the browser's
 * MediaRecorder produced), `?clientId=` for optimistic UI matching.
 * The note is converted, stored, then broadcast like any message.
 */
export default defineHandler(async (event) => {
  const user = await requireUser(event)
  const roomId = getRouterParam(event, "id") ?? ""
  if (!UUID_RE.test(roomId)) throw badRequest("Invalid room id")
  if (!(await isRoomMember(roomId, user.id))) {
    throw new HTTPError({ status: 404, message: "Room not found" })
  }

  const type = event.req.headers.get("content-type") ?? ""
  if (!/^(audio\/|video\/(webm|mp4)|application\/octet-stream)/.test(type)) {
    throw new HTTPError({ status: 415, message: "Format audio non pris en charge" })
  }
  const tooLarge = () =>
    new HTTPError({ status: 413, message: "Message vocal trop volumineux (10 Mo maximum)" })
  if (Number(event.req.headers.get("content-length") ?? 0) > MAX_VOICE_BYTES) throw tooLarge()

  const audio = new Uint8Array(await event.req.arrayBuffer())
  if (audio.byteLength > MAX_VOICE_BYTES) throw tooLarge()
  if (audio.byteLength === 0) throw badRequest("Message vocal vide")

  const query = getQuery(event)
  const clientId = typeof query.clientId === "string" ? query.clientId.slice(0, 100) : undefined

  try {
    const { mediaPath, durationMs } = await storeVoice(audio)
    try {
      const message = await postMessage(
        roomId,
        user.id,
        { kind: "voice", mediaPath, mediaDurationMs: durationMs },
        clientId,
      )
      return { message }
    } catch (error) {
      // Don't keep an audio file no message points to.
      await rm(mediaFile(mediaPath), { force: true })
      throw error
    }
  } catch (error) {
    if (error instanceof VoiceError) {
      throw new HTTPError({ status: error.status, message: error.message })
    }
    throw error
  }
})
