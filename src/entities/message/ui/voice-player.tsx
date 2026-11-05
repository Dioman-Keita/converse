import { Pause, Play } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { useI18n } from "@/shared/i18n"
import { cn } from "@/shared/lib/utils"

// Only one voice note plays at a time across the page.
let playing: HTMLAudioElement | null = null

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

type VoicePlayerProps = {
  src: string
  durationMs: number
  /** Own notes play with a pink sticker, the others' with a blue one. */
  mine?: boolean
}

export function VoicePlayer({ src, durationMs, mine }: VoicePlayerProps) {
  const { t } = useI18n()
  const audio = useRef<HTMLAudioElement>(null)
  const [isPlaying, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)

  useEffect(() => {
    const el = audio.current
    return () => {
      if (el && playing === el) {
        el.pause()
        playing = null
      }
    }
  }, [])

  function toggle() {
    const el = audio.current
    if (!el) return
    if (el.paused) {
      if (playing && playing !== el) playing.pause()
      playing = el
      void el.play().catch(() => setPlaying(false))
    } else {
      el.pause()
    }
  }

  function seek(ratio: number) {
    const el = audio.current
    if (!el) return
    el.currentTime = (durationMs / 1000) * ratio
    setPosition(el.currentTime * 1000)
  }

  const progress = durationMs > 0 ? Math.min(1, position / durationMs) : 0

  return (
    <div className="flex w-56 max-w-full items-center gap-3 py-1">
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setPosition(0)
        }}
        onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime * 1000)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? t("voice.pause") : t("voice.play")}
        className={cn(
          "sticker relative flex size-9 shrink-0 items-center justify-center rounded-full text-ink",
          "transition-[rotate,scale] duration-150 hover:-rotate-12 active:scale-90 motion-reduce:transition-none",
          mine ? "bg-pink-wash" : "bg-blue-wash",
        )}
      >
        {/* Soft pulse around the button while the note plays. */}
        {isPlaying && (
          <span
            aria-hidden
            className={cn(
              "absolute inset-0 animate-ping rounded-full opacity-40 motion-reduce:hidden",
              mine ? "bg-pink" : "bg-blue",
            )}
            style={{ animationDuration: "1.6s" }}
          />
        )}
        {/* Both icons stay mounted and cross-fade with a quarter turn when the state flips. */}
        <Play
          aria-hidden
          className={cn(
            "absolute size-4 translate-x-px transition-all duration-200 ease-out motion-reduce:transition-none",
            isPlaying ? "scale-50 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
          )}
        />
        <Pause
          aria-hidden
          className={cn(
            "absolute size-4 transition-all duration-200 ease-out motion-reduce:transition-none",
            isPlaying ? "scale-100 rotate-0 opacity-100" : "scale-50 rotate-90 opacity-0",
          )}
        />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div
          role="slider"
          aria-label={t("voice.position")}
          aria-valuemin={0}
          aria-valuemax={Math.round(durationMs / 1000)}
          aria-valuenow={Math.round(position / 1000)}
          tabIndex={0}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            seek((e.clientX - rect.left) / rect.width)
          }}
          onKeyDown={(e) => {
            const step = 5000 / Math.max(durationMs, 1)
            if (e.key === "ArrowRight") seek(Math.min(1, progress + step))
            if (e.key === "ArrowLeft") seek(Math.max(0, progress - step))
          }}
          className="relative h-2 cursor-pointer rounded-full bg-ink/15"
        >
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full", mine ? "bg-pink-ink" : "bg-ink/70")}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="text-xs text-ink-soft tabular-nums">
          {formatDuration(isPlaying || position > 0 ? position : durationMs)}
        </span>
      </div>
    </div>
  )
}
