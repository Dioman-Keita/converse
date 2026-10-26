import { rm } from "node:fs/promises"
import { defineHandler, getQuery, getRouterParam } from "nitro/h3"

import { badRequest, requireUser } from "../../../utils/http"
import { localizedError } from "../../../utils/i18n"
import { storeImage, MAX_IMAGE_BYTES } from "../../../utils/images"
import { MediaError, removeMedia } from "../../../utils/media"
import { postMessage } from "../../../utils/messages"
import { UUID_RE, isRoomMember } from "../../../utils/rooms"
import { MAX_VIDEO_BYTES, acceptVideo, enqueueVideo } from "../../../utils/videos"

// SVG is an image type but can carry scripts: never accepted.
const IMAGE_TYPE = /^image\/(jpeg|png|webp|gif|avif|heic|heif)$/
const VIDEO_TYPE = /^video\//

/**
 * Upload a photo or a video: the raw file as the request body with its own
 * Content-Type, `?clientId=` for optimistic UI matching.
 * - photo: re-encoded and posted right away;
 * - video: checked, posted as `processing`, converted in the background.
 */
export default defineHandler(async (event) => {
  const user = await requireUser(event)
  const roomId = getRouterParam(event, "id") ?? ""
  if (!UUID_RE.test(roomId)) throw badRequest("Invalid room id")
  if (!(await isRoomMember(roomId, user.id))) throw localizedError(event, 404, "roomNotFound")

  const type = (event.req.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase()
  const isImage = IMAGE_TYPE.test(type)
  if (!isImage && !VIDEO_TYPE.test(type)) throw localizedError(event, 415, "mediaUnsupportedFormat")

  const limit = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES
  const tooLarge = () => localizedError(event, 413, isImage ? "imageTooLarge" : "videoTooLarge")
  if (Number(event.req.headers.get("content-length") ?? 0) > limit) throw tooLarge()
  const body = new Uint8Array(await event.req.arrayBuffer())
  if (body.byteLength > limit) throw tooLarge()
  if (body.byteLength === 0) throw localizedError(event, 400, "mediaEmpty")

  const query = getQuery(event)
  const clientId = typeof query.clientId === "string" ? query.clientId.slice(0, 100) : undefined

  try {
    if (isImage) {
      const { mediaPath, width, height } = await storeImage(body)
      try {
        const message = await postMessage(
          roomId,
          user.id,
          { kind: "image", mediaPath, mediaWidth: width, mediaHeight: height },
          clientId,
        )
        return { message }
      } catch (error) {
        await removeMedia(mediaPath)
        throw error
      }
    }

    const { file, durationMs } = await acceptVideo(body)
    try {
      const message = await postMessage(roomId, user.id, { kind: "video", mediaDurationMs: durationMs }, clientId)
      enqueueVideo(message.id, file)
      return { message }
    } catch (error) {
      await rm(file, { force: true })
      throw error
    }
  } catch (error) {
    if (error instanceof MediaError) throw localizedError(event, error.status, error.key)
    throw error
  }
})
