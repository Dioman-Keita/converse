/**
 * Videos are converted in the background:
 * - phones record formats not every browser plays (iPhone: HEVC in .mov), so every
 *   video becomes H.264/AAC MP4, at most 1280 px, upright, without metadata;
 * - conversion can outlast the tunnel's ~100 s request limit, so the upload returns
 *   at once with a `processing` message, and the finished message is broadcast later.
 * One video converts at a time to keep the host machine responsive.
 */
import { randomUUID } from "node:crypto"
import { rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { eq } from "drizzle-orm"

import { db, schema } from "../db/client"
import { MediaError, ffmpeg, mediaFile, newMediaPath, probe, removeMedia } from "./media"
import { publishMessage } from "./messages"

// Cloudflare's free plan refuses request bodies over 100 MB.
export const MAX_VIDEO_BYTES = 95 * 1024 * 1024
export const MAX_VIDEO_MS = 5 * 60 * 1000
const MAX_SIDE = 1280
const CONVERT_TIMEOUT_MS = 20 * 60 * 1000

/** Saves the upload to a temp file and checks it's a readable video within limits. */
export async function acceptVideo(input: Uint8Array): Promise<{ file: string; durationMs: number }> {
  const file = join(tmpdir(), `converse-${randomUUID()}.video`)
  await writeFile(file, input)
  try {
    const { durationMs, width } = await probe(file, "videoUnreadable")
    if (!width) throw new MediaError(400, "videoUnreadable")
    if (durationMs > MAX_VIDEO_MS + 2_000) throw new MediaError(400, "videoTooLong")
    return { file, durationMs }
  } catch (error) {
    await rm(file, { force: true })
    throw error
  }
}

let queue: Promise<void> = Promise.resolve()

/** Converts `file` for message `messageId` once earlier videos are done. */
export function enqueueVideo(messageId: string, file: string): void {
  queue = queue.then(() => convert(messageId, file)).catch((error: unknown) => {
    console.error("[converse] video queue error", error)
  })
}

async function convert(messageId: string, input: string): Promise<void> {
  const videoPath = await newMediaPath("videos", "mp4")
  const posterPath = await newMediaPath("videos", "jpg")
  try {
    await ffmpeg(
      [
        "-i", input,
        "-map", "0:v:0", "-map", "0:a:0?",
        "-vf", `scale='min(${MAX_SIDE},iw)':'min(${MAX_SIDE},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "26", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "96k",
        "-map_metadata", "-1", "-movflags", "+faststart",
        mediaFile(videoPath),
      ],
      CONVERT_TIMEOUT_MS,
      "videoUnreadable",
    )
    await ffmpeg(
      ["-i", mediaFile(videoPath), "-frames:v", "1", "-vf", "scale='min(640,iw)':-2", "-q:v", "4", mediaFile(posterPath)],
      60_000,
      "videoUnreadable",
    )
    const { durationMs, width, height } = await probe(mediaFile(videoPath), "videoUnreadable")

    const rows = await db
      .update(schema.messages)
      .set({
        mediaPath: videoPath,
        mediaPosterPath: posterPath,
        mediaDurationMs: durationMs,
        mediaWidth: width ?? null,
        mediaHeight: height ?? null,
        mediaStatus: "ready",
      })
      .where(eq(schema.messages.id, messageId))
      .returning()
    const row = rows.at(0)
    // The message may have been deleted meanwhile (room removed): drop the files.
    if (row) publishMessage(row)
    else await removeMedia(videoPath, posterPath)
  } catch (error) {
    console.error(`[converse] video ${messageId} conversion failed`, error)
    await removeMedia(videoPath, posterPath)
    const rows = await db
      .update(schema.messages)
      .set({ mediaStatus: "failed" })
      .where(eq(schema.messages.id, messageId))
      .returning()
    const row = rows.at(0)
    if (row) publishMessage(row)
  } finally {
    await rm(input, { force: true })
  }
}

/** Videos left `processing` by a restart will never finish: mark them failed. */
export async function failInterruptedVideos(): Promise<number> {
  const rows = await db
    .update(schema.messages)
    .set({ mediaStatus: "failed" })
    .where(eq(schema.messages.mediaStatus, "processing"))
    .returning({ id: schema.messages.id })
  return rows.length
}
