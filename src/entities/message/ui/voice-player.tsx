import { Pause, Play } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { useI18n } from "@/shared/i18n"
import { seeded } from "@/shared/lib/seeded"
import { cn } from "@/shared/lib/utils"

// Only one voice note plays at a time across the page.
let playing: HTMLAudioElement | null = null

const BARS = 36

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}

type VoicePlayerProps = {
  src: string
  durationMs: number
  /** Seeds the waveform's shape so each note keeps its own. */
  seed: string
  /** Inside a light (own) bubble: dark controls. */
  mine?: boolean
}

/** Round play button and a waveform that fills as the note plays; click or arrow keys to seek. */
export function VoicePlayer({ src, durationMs, seed, mine }: VoicePlayerProps) {
  const { t } = useI18n()
  const audio = useRef<HTMLAudioElement>(null)
  const [isPlaying, setPlaying] = useState(false)
  const [position, setPosition] = useState(0)

  // A decorative waveform: smooth random heights, stable per message.
  const bars = useMemo(() => {
    const next = seeded(seed)
    let previous = 0.5
    return Array.from({ length: BARS }, () => {
      previous = Math.min(1, Math.max(0.15, previous * 0.5 + next() * 0.6))
      return previous
    })
  }, [seed])

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
    <div className="flex w-64 max-w-full items-center gap-3 py-0.5">
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
          "relative flex size-9 shrink-0 items-center justify-center rounded-full transition-transform duration-150 active:scale-90",
          mine ? "bg-gray-50 text-gray-900" : "bg-gray-900 text-gray-50",
        )}
      >
        {/* Both icons stay mounted and cross-fade when the state flips. */}
        <Play
          aria-hidden
          className={cn(
            "absolute size-4 translate-x-px fill-current transition-all duration-200 ease-out",
            isPlaying ? "scale-50 opacity-0" : "scale-100 opacity-100",
          )}
        />
        <Pause
          aria-hidden
          className={cn(
            "absolute size-4 fill-current transition-all duration-200 ease-out",
            isPlaying ? "scale-100 opacity-100" : "scale-50 opacity-0",
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
          className="flex h-7 cursor-pointer items-center gap-[2px] rounded-sm"
        >
          {bars.map((height, i) => {
            const played = (i + 0.5) / BARS <= progress
            return (
              <span
                key={i}
                className={cn(
                  "w-[3px] flex-1 rounded-full transition-colors duration-150",
                  played
                    ? mine
                      ? "bg-gray-50"
                      : "bg-gray-900"
                    : mine
                      ? "bg-gray-50/25"
                      : "bg-gray-900/25",
                )}
                style={{ height: `${Math.round(height * 100)}%` }}
              />
            )
          })}
        </div>
        <span className={cn("font-mono text-[11px] tabular-nums", mine ? "text-gray-50/60" : "text-gray-700")}>
          {formatDuration(isPlaying || position > 0 ? position : durationMs)}
        </span>
      </div>
    </div>
  )
}
