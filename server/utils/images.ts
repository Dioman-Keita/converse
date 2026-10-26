/**
 * Photos are re-encoded on upload:
 * - turned upright using the EXIF orientation phones write instead of rotating pixels;
 * - stripped of all metadata (EXIF, GPS position, camera serials) — privacy;
 * - scaled down to 2048 px on the longest side;
 * - stored as WebP (every current browser, transparency and GIF animation kept).
 * Re-encoding also means nothing but pixels is ever served back (no SVG/HTML tricks).
 */
import sharp from "sharp"
import type { Sharp } from "sharp"

import { MediaError, mediaFile, newMediaPath, removeMedia } from "./media"

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024
const MAX_SIDE = 2048
// Rejects decompression bombs (e.g. a tiny file declaring 100 000 × 100 000 px).
const MAX_INPUT_PIXELS = 100_000_000

export async function storeImage(
  input: Uint8Array,
): Promise<{ mediaPath: string; width: number; height: number }> {
  let pipeline: Sharp
  try {
    pipeline = sharp(input, { animated: true, limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" })
    const meta = await pipeline.metadata()
    // Animations are capped so a huge GIF can't stall the server.
    if ((meta.pages ?? 1) > 300) throw new MediaError(400, "imageUnreadable")
  } catch (error) {
    if (error instanceof MediaError) throw error
    throw new MediaError(400, "imageUnreadable")
  }

  const mediaPath = await newMediaPath("images", "webp")
  try {
    const info = await pipeline
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(mediaFile(mediaPath))
    // For animations, `height` covers all frames stacked; `pageHeight` is one frame.
    const height = info.pageHeight ?? info.height
    return { mediaPath, width: info.width, height }
  } catch {
    await removeMedia(mediaPath)
    throw new MediaError(400, "imageUnreadable")
  }
}
