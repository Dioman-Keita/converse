import { defineHandler } from "nitro/h3"

import { serveMessageMedia } from "../../utils/media-response"

/** Voice audio, photo or video of a message, for members of its room only. */
export default defineHandler((event) => serveMessageMedia(event, "file"))
