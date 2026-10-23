import { Pause, Play } from "lucide-react"
import { useEffect, useRef, useState } from "react"

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
  /** Colors adapted to the bubble (own messages sit on the primary color). */
  mine?: boolean
}

export function VoicePlayer({ src, durationMs, mine }: VoicePlayerProps) {
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
    <div className="flex w-56 max-w-full items-center gap-2.5 py-0.5">
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
        aria-label={isPlaying ? "Mettre en pause" : "Écouter le message vocal"}
        className={cn(
          "relative flex size-8 shrink-0 items-center justify-center rounded-full",
          "transition-[background-color,transform] duration-150 active:scale-90 motion-reduce:transition-none",
          mine
            ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
            : "bg-foreground/10 text-foreground hover:bg-foreground/20",
        )}
      >
        {/* Soft pulse around the button while the note plays. */}
        {isPlaying && (
          <span
            aria-hidden
            className={cn(
              "absolute inset-0 animate-ping rounded-full opacity-30 motion-reduce:hidden",
              mine ? "bg-primary-foreground" : "bg-foreground",
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
          aria-label="Position de lecture"
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
          className={cn(
            "relative h-1.5 cursor-pointer rounded-full",
            mine ? "bg-primary-foreground/25" : "bg-foreground/15",
          )}
        >
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              mine ? "bg-primary-foreground" : "bg-foreground/70",
            )}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span
          className={cn(
            "text-[0.7rem] tabular-nums",
            mine ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {formatDuration(isPlaying || position > 0 ? position : durationMs)}
        </span>
      </div>
    </div>
  )
}
