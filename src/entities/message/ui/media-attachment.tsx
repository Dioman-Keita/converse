import { CircleAlert } from "lucide-react"
import type { CSSProperties, ReactNode } from "react"

import { useI18n } from "@/shared/i18n"
import { Spinner } from "@/shared/ui"

import type { ChatMessage } from "../model/types"
import { formatDuration } from "./voice-player"

// Media never exceed this width; height follows the media's aspect ratio.
const MAX_WIDTH = 320
const MAX_HEIGHT = 380

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

/** Photo or video of a message, including its uploading, processing and failed states. */
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
            className="group block size-full cursor-zoom-in"
            aria-label={t("media.open")}
            disabled={!!upload}
            onClick={() => onOpenImage(src, t("media.photo"))}
          >
            <img
              src={src}
              alt={t("media.photo")}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
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
        <Frame style={boxStyle()}>
          <div className="shimmer flex size-full items-center justify-center">
            <span className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-gray-900 backdrop-blur">
              <Spinner className="size-3.5" />
              {t("media.processing")}
            </span>
          </div>
        </Frame>
      )
    }
    if (video.status === "failed") {
      return (
        <Frame style={boxStyle()}>
          <div className="flex size-full flex-col items-center justify-center gap-2 bg-gray-100 p-4 text-center">
            <CircleAlert className="size-5 text-red" aria-hidden />
            <span className="text-[13px] text-gray-700">{t("media.failed")}</span>
          </div>
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

function Frame({ style, progress, children }: { style: CSSProperties; progress?: number; children: ReactNode }) {
  const { t } = useI18n()
  const percent = progress === undefined ? undefined : Math.round(progress * 100)
  return (
    <div
      className="relative max-w-full overflow-hidden rounded-2xl border border-hairline bg-gray-100"
      style={{ ...style, maxWidth: "100%" }}
    >
      {children}
      {percent !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <div className="relative flex size-12 items-center justify-center text-white">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${(percent / 100) * 100.5} 100.5`}
                className="transition-[stroke-dasharray] duration-200"
              />
            </svg>
            <span className="font-mono text-[11px] tabular-nums">{percent}%</span>
          </div>
          <span className="sr-only" role="status">
            {t("media.uploading", { percent })}
          </span>
        </div>
      )}
    </div>
  )
}
