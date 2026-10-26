/**
 * Voice notes: browsers record in different containers (Chrome/Android: WebM/Opus,
 * Safari/iOS: MP4/AAC) and not every browser plays both. Every upload is converted
 * once with ffmpeg to mono AAC in an M4A container, which all of them play.
 */
import { execFile } from "node:child_process"
import { randomUUID } from "node:crypto"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { promisify } from "node:util"

import type { MessageKey } from "./i18n"

const run = promisify(execFile)

export const MAX_VOICE_BYTES = 10 * 1024 * 1024
export const MAX_VOICE_MS = 5 * 60 * 1000
export const MIN_VOICE_MS = 300

const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg"
const FFPROBE = process.env.FFPROBE_PATH ?? "ffprobe"

/** Root for uploaded media; a Docker volume in production (./data/uploads). */
export const UPLOADS_DIR = resolve(process.env.UPLOADS_DIR ?? "data/uploads")

export class VoiceError extends Error {
  readonly status: number
  readonly key: MessageKey

  constructor(status: number, key: MessageKey) {
    super(key)
    this.status = status
    this.key = key
  }
}

/**
 * Converts raw recorded audio to `voice/<uuid>.m4a` under UPLOADS_DIR.
 * Returns the stored path (relative to UPLOADS_DIR) and the real duration.
 */
export async function storeVoice(
  audio: Uint8Array,
): Promise<{ mediaPath: string; durationMs: number }> {
  const id = randomUUID()
  const input = join(tmpdir(), `converse-${id}.upload`)
  const relative = `voice/${id}.m4a`
  const output = join(UPLOADS_DIR, relative)

  await mkdir(join(UPLOADS_DIR, "voice"), { recursive: true })
  await writeFile(input, audio)
  try {
    try {
      await run(
        FFMPEG,
        ["-hide_banner", "-loglevel", "error", "-y", "-i", input,
         "-vn", "-ac", "1", "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", output],
        { timeout: 60_000 },
      )
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        console.error("[converse] ffmpeg not found — voice messages are unavailable")
        throw new VoiceError(503, "voiceUnavailable")
      }
      throw new VoiceError(400, "voiceUnreadable")
    }

    const durationMs = await probeDurationMs(output)
    if (durationMs < MIN_VOICE_MS) {
      throw new VoiceError(400, "voiceTooShort")
    }
    // Small tolerance: containers often report a few ms over the recorder's limit.
    if (durationMs > MAX_VOICE_MS + 2_000) {
      throw new VoiceError(400, "voiceTooLong")
    }
    return { mediaPath: relative, durationMs }
  } catch (error) {
    await rm(output, { force: true })
    throw error
  } finally {
    await rm(input, { force: true })
  }
}

async function probeDurationMs(file: string): Promise<number> {
  const { stdout } = await run(
    FFPROBE,
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { timeout: 15_000 },
  )
  const seconds = Number.parseFloat(stdout.trim())
  if (!Number.isFinite(seconds)) throw new VoiceError(400, "voiceUnreadable")
  return Math.round(seconds * 1000)
}

/** Absolute path of a stored media file; refuses anything escaping UPLOADS_DIR. */
export function mediaFile(mediaPath: string): string {
  const file = resolve(UPLOADS_DIR, mediaPath)
  if (!file.startsWith(UPLOADS_DIR)) throw new Error("Invalid media path")
  return file
}
