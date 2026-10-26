/**
 * Documents (PDF, Office files, archives, …) are stored exactly as sent — no
 * conversion — under a random name with no extension. They are only ever served
 * as downloads (Content-Disposition: attachment), never rendered by the browser,
 * so an HTML or SVG "document" can't run in the app's origin.
 */
import { writeFile } from "node:fs/promises"

import { mediaFile, newMediaPath } from "./media"

// Cloudflare's free plan refuses request bodies over 100 MB.
export const MAX_FILE_BYTES = 95 * 1024 * 1024
const MAX_NAME_LENGTH = 200
const FALLBACK_NAME = "file"

/**
 * Display name from the client's `X-File-Name` header (URI-encoded): no folders,
 * no control characters, at most 200 characters keeping the extension.
 */
export function sanitizeFileName(raw: string | null): string {
  let name = raw ?? ""
  try {
    name = decodeURIComponent(name)
  } catch {
    // Not encoded (or malformed): keep it as-is, it's cleaned below anyway.
  }
  name = name.split(/[/\\]/).pop() ?? ""
  // eslint-disable-next-line no-control-regex
  name = name.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim()
  if (!name || name === "." || name === "..") return FALLBACK_NAME

  if (name.length > MAX_NAME_LENGTH) {
    const dot = name.lastIndexOf(".")
    const ext = dot > 0 && name.length - dot <= 10 ? name.slice(dot) : ""
    name = name.slice(0, MAX_NAME_LENGTH - ext.length).trimEnd() + ext
  }
  return name
}

/** Declared type, kept only to pick an icon; anything odd becomes generic binary. */
export function sanitizeMime(raw: string | null): string {
  const mime = (raw ?? "").split(";")[0].trim().toLowerCase()
  return /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(mime) && mime.length <= 100
    ? mime
    : "application/octet-stream"
}

export async function storeFile(bytes: Uint8Array): Promise<string> {
  const mediaPath = await newMediaPath("files", "bin")
  await writeFile(mediaFile(mediaPath), bytes)
  return mediaPath
}

/** `Content-Disposition` forcing a download, with the name in both header forms. */
export function attachmentDisposition(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_")
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`
}
