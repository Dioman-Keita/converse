/**
 * Shared plumbing for uploaded media (voice notes, photos, videos): where files
 * live, safe paths, ffmpeg/ffprobe, and errors carrying a translated message key.
 */
import { execFile } from "node:child_process"
import { randomUUID } from "node:crypto"
import { mkdir, rm } from "node:fs/promises"
import { join, resolve, sep } from "node:path"
import { promisify } from "node:util"

import type { MessageKey } from "./i18n"

export const run = promisify(execFile)

export const FFMPEG = process.env.FFMPEG_PATH ?? "ffmpeg"
export const FFPROBE = process.env.FFPROBE_PATH ?? "ffprobe"

/** Root for uploaded media; a Docker volume in production (`uploads`). */
export const UPLOADS_DIR = resolve(process.env.UPLOADS_DIR ?? "data/uploads")

export class MediaError extends Error {
  readonly status: number
  readonly key: MessageKey

  constructor(status: number, key: MessageKey) {
    super(key)
    this.status = status
    this.key = key
  }
}

/** Absolute path of a stored media file; refuses anything escaping UPLOADS_DIR. */
export function mediaFile(mediaPath: string): string {
  const file = resolve(UPLOADS_DIR, mediaPath)
  if (!file.startsWith(UPLOADS_DIR + sep)) throw new Error("Invalid media path")
  return file
}

/** A fresh `<folder>/<uuid>.<ext>` path (relative) with its folder created. */
export async function newMediaPath(folder: string, ext: string): Promise<string> {
  await mkdir(join(UPLOADS_DIR, folder), { recursive: true })
  return `${folder}/${randomUUID()}.${ext}`
}

export async function removeMedia(...paths: (string | null | undefined)[]): Promise<void> {
  for (const path of paths) {
    if (path) await rm(mediaFile(path), { force: true })
  }
}

/** Runs ffmpeg; a missing binary becomes a clear 503 instead of a generic failure. */
export async function ffmpeg(args: string[], timeoutMs: number, unreadable: MessageKey): Promise<void> {
  try {
    await run(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...args], {
      timeout: timeoutMs,
      maxBuffer: 16 * 1024 * 1024,
    })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.error("[converse] ffmpeg not found — voice and video messages are unavailable")
      throw new MediaError(503, "mediaUnavailable")
    }
    throw new MediaError(400, unreadable)
  }
}

export type ProbedStream = { durationMs: number; width?: number; height?: number }

/** Duration (and video dimensions, after rotation) of a media file. */
export async function probe(file: string, unreadable: MessageKey): Promise<ProbedStream> {
  let stdout: string
  try {
    ;({ stdout } = await run(
      FFPROBE,
      ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", file],
      { timeout: 15_000 },
    ))
  } catch {
    throw new MediaError(400, unreadable)
  }
  const info = JSON.parse(stdout) as {
    format?: { duration?: string }
    streams?: { codec_type?: string; width?: number; height?: number; side_data_list?: { rotation?: number }[]; tags?: { rotate?: string } }[]
  }
  const seconds = Number.parseFloat(info.format?.duration ?? "")
  if (!Number.isFinite(seconds)) throw new MediaError(400, unreadable)

  const video = info.streams?.find((s) => s.codec_type === "video")
  let width = video?.width
  let height = video?.height
  const rotation = Math.abs(
    Number(video?.side_data_list?.find((d) => d.rotation !== undefined)?.rotation ?? video?.tags?.rotate ?? 0),
  )
  // Phones store portrait videos as landscape + a rotation flag.
  if (rotation === 90 || rotation === 270) [width, height] = [height, width]
  return { durationMs: Math.round(seconds * 1000), width, height }
}
