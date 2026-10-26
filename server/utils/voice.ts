/**
 * Voice notes: browsers record in different containers (Chrome/Android: WebM/Opus,
 * Safari/iOS: MP4/AAC) and not every browser plays both. Every upload is converted
 * once with ffmpeg to mono AAC in an M4A container, which all of them play.
 */
import { randomUUID } from "node:crypto"
import { rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { MediaError, ffmpeg, mediaFile, newMediaPath, probe, removeMedia } from "./media"

export { MediaError as VoiceError, mediaFile } from "./media"

export const MAX_VOICE_BYTES = 10 * 1024 * 1024
export const MAX_VOICE_MS = 5 * 60 * 1000
export const MIN_VOICE_MS = 300

/**
 * Converts raw recorded audio to `voice/<uuid>.m4a` under UPLOADS_DIR.
 * Returns the stored path (relative to UPLOADS_DIR) and the real duration.
 */
export async function storeVoice(
  audio: Uint8Array,
): Promise<{ mediaPath: string; durationMs: number }> {
  const input = join(tmpdir(), `converse-${randomUUID()}.upload`)
  const mediaPath = await newMediaPath("voice", "m4a")
  await writeFile(input, audio)
  try {
    await ffmpeg(
      ["-i", input, "-vn", "-ac", "1", "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", mediaFile(mediaPath)],
      60_000,
      "voiceUnreadable",
    )
    const { durationMs } = await probe(mediaFile(mediaPath), "voiceUnreadable")
    if (durationMs < MIN_VOICE_MS) throw new MediaError(400, "voiceTooShort")
    // Small tolerance: containers often report a few ms over the recorder's limit.
    if (durationMs > MAX_VOICE_MS + 2_000) throw new MediaError(400, "voiceTooLong")
    return { mediaPath, durationMs }
  } catch (error) {
    await removeMedia(mediaPath)
    throw error
  } finally {
    await rm(input, { force: true })
  }
}
