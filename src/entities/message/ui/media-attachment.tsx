import type { CSSProperties, ReactNode } from "react"

import { useI18n } from "@/shared/i18n"
import { Tape } from "@/shared/ui"

import type { ChatMessage } from "../model/types"
import { formatDuration } from "./voice-player"

// Bubbles never exceed this width; height follows the media's aspect ratio.
const MAX_WIDTH = 288
const MAX_HEIGHT = 360

/** Box size keeping the aspect ratio inside MAX_WIDTH × MAX_HEIGHT (no layout jump). */
function boxStyle(width?: number, height?: number): CSSProperties {
  if (!width || !height) return { width: MAX_WIDTH, aspectRatio: "4 / 3" }
  const scale = Math.min(1, MAX_WIDTH / width, MAX_HEIGHT / height)
  return { width: Math.round(width * scale), aspectRatio: `${width} / ${height}` }
}

type MediaAttachmentProps = {
  message: ChatMessage
  /** Opens a photo full screen. */
  onOpenImage: (src: string, alt: string) => void
}

/**
 * Photo or video of a message as a taped polaroid, including its uploading,
 * processing ("developing…") and failed states.
 */
export function MediaAttachment({ message, onOpenImage }: MediaAttachmentProps) {
  const { t } = useI18n()
  const { upload } = message

  if (message.kind === "image") {
    const src = upload?.localUrl ?? message.image?.url
    return (
      <Frame style={boxStyle(message.image?.width, message.image?.height)} progress={upload?.progress}>
        {src && (
          <button
            type="button"
            className="block size-full"
            aria-label={t("media.open")}
            disabled={!!upload}
            onClick={() => onOpenImage(src, t("media.photo"))}
          >
            <img src={src} alt={t("media.photo")} loading="lazy" className="size-full object-cover" />
          </button>
        )}
      </Frame>
    )
  }

  if (message.kind === "video") {
    // While uploading, play the local file; once posted, follow the server status.
    if (upload) {
      return (
        <Frame style={boxStyle()} progress={upload.progress}>
          <video src={upload.localUrl} muted playsInline preload="metadata" className="size-full object-cover" />
        </Frame>
      )
    }
    const video = message.video
    if (!video || video.status === "processing") {
      return (
        <Frame style={boxStyle()} caption={t("media.processing")}>
          <div className="developing size-full" />
        </Frame>
      )
    }
    if (video.status === "failed") {
      return (
        <Frame style={boxStyle()}>
          <Status label={t("media.failed")} />
        </Frame>
      )
    }
    return (
      <Frame style={boxStyle(video.width, video.height)}>
        <video
          src={video.url}
          poster={video.posterUrl}
          controls
          playsInline
          preload="none"
          aria-label={`${t("media.video")} · ${formatDuration(video.durationMs)}`}
          className="size-full bg-black object-contain"
        />
      </Frame>
    )
  }

  return null
}

function Frame({
  style,
  progress,
  caption,
  children,
}: {
  style: CSSProperties
  progress?: number
  /** Handwritten under the photo, on the polaroid's wide bottom edge. */
  caption?: string
  children: ReactNode
}) {
  const { t } = useI18n()
  const percent = progress === undefined ? undefined : Math.round(progress * 100)
  return (
    <div className="polaroid max-w-full p-2 pb-1">
      <Tape angle={-4} className="h-5 w-20" />
      <div className="relative max-w-full overflow-hidden bg-[#1f1f1f]" style={{ ...style, maxWidth: "100%" }}>
        {children}
        {percent !== undefined && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-desk/45 text-paper-light">
            <div className="relative flex size-14 items-center justify-center">
              <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
                <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${(percent / 100) * 100.5} 100.5`}
                  filter="url(#rough)"
                  className="transition-[stroke-dasharray] duration-200"
                />
              </svg>
              <span className="font-title text-base tabular-nums">{percent}%</span>
            </div>
            <span className="sr-only" role="status">
              {t("media.uploading", { percent })}
            </span>
          </div>
        )}
      </div>
      <p className="m-0 min-h-7 truncate px-1 pt-1 text-center text-base leading-6 text-ink-soft">
        {caption ?? (percent !== undefined ? t("media.uploading", { percent }) : "")}
      </p>
    </div>
  )
}

function Status({ label }: { label: string }) {
  return (
    <div className="paper flex size-full flex-col items-center justify-center gap-1 p-4 text-center">
      <span className="font-title text-3xl text-error-ink" aria-hidden>
        ✗
      </span>
      <span className="text-base text-ink-soft">{label}</span>
    </div>
  )
}
