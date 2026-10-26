import { defineHandler } from "nitro/h3"

import { serveMessageMedia } from "../../../utils/media-response"

/** Poster frame (JPEG) of a converted video, for members of its room only. */
export default defineHandler((event) => serveMessageMedia(event, "poster"))
