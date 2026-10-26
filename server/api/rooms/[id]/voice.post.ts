import { rm } from "node:fs/promises"
import { defineHandler, getQuery, getRouterParam } from "nitro/h3"

import { postMessage } from "../../../utils/messages"
import { badRequest, requireUser } from "../../../utils/http"
import { localizedError } from "../../../utils/i18n"
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
    throw localizedError(event, 404, "roomNotFound")
  }

  const type = event.req.headers.get("content-type") ?? ""
  if (!/^(audio\/|video\/(webm|mp4)|application\/octet-stream)/.test(type)) {
    throw localizedError(event, 415, "voiceUnsupportedFormat")
  }
  const tooLarge = () => localizedError(event, 413, "voiceTooLarge")
  if (Number(event.req.headers.get("content-length") ?? 0) > MAX_VOICE_BYTES) throw tooLarge()

  const audio = new Uint8Array(await event.req.arrayBuffer())
  if (audio.byteLength > MAX_VOICE_BYTES) throw tooLarge()
  if (audio.byteLength === 0) throw localizedError(event, 400, "voiceEmpty")

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
      throw localizedError(event, error.status, error.key)
    }
    throw error
  }
})
