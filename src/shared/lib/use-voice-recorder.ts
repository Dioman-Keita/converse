import { useCallback, useEffect, useRef, useState } from "react"

import type { MessageKey } from "@/shared/i18n"

/** Preferred containers, best first. The server converts whatever we send. */
const MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]

export type RecorderState =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "recording"; startedAt: number }
  | { status: "error"; message: MessageKey }

export type Recording = { blob: Blob; durationMs: number }

/** True when this browser can record audio here (needs HTTPS or localhost). */
export function canRecordVoice(): boolean {
  return (
    typeof window !== "undefined" &&
    // mediaDevices only exists in secure contexts, hence this check first.
    window.isSecureContext &&
    typeof MediaRecorder !== "undefined" &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  )
}

function pickMimeType(): string | undefined {
  return MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
}

/** Translation key explaining why recording couldn't start. */
function describeError(error: unknown): MessageKey {
  const name = error instanceof DOMException ? error.name : ""
  if (name === "NotAllowedError" || name === "SecurityError") return "mic.denied"
  if (name === "NotFoundError" || name === "OverconstrainedError") return "mic.notFound"
  if (name === "NotReadableError") return "mic.busy"
  return "mic.failed"
}

/**
 * Records one voice note at a time with MediaRecorder.
 * `stop()` resolves with the recording; `cancel()` discards it. Recording stops
 * by itself after `maxMs` and calls `onAutoStop` with the result.
 */
export function useVoiceRecorder({
  maxMs,
  onAutoStop,
}: {
  maxMs: number
  onAutoStop: (recording: Recording) => void
}) {
  const [state, setState] = useState<RecorderState>({ status: "idle" })
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const chunks = useRef<Blob[]>([])
  const startedAt = useRef(0)
  const limitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onAutoStopRef = useRef(onAutoStop)
  onAutoStopRef.current = onAutoStop

  const release = useCallback(() => {
    clearTimeout(limitTimer.current)
    for (const track of stream.current?.getTracks() ?? []) track.stop()
    stream.current = null
    recorder.current = null
    chunks.current = []
  }, [])

  const finish = useCallback((): Promise<Recording | null> => {
    const active = recorder.current
    if (!active || active.state === "inactive") {
      release()
      setState({ status: "idle" })
      return Promise.resolve(null)
    }
    return new Promise((resolve) => {
      active.onstop = () => {
        const blob = new Blob(chunks.current, { type: active.mimeType || "audio/webm" })
        const durationMs = Date.now() - startedAt.current
        release()
        setState({ status: "idle" })
        resolve(blob.size > 0 ? { blob, durationMs } : null)
      }
      active.stop()
    })
  }, [release])

  const start = useCallback(async () => {
    if (recorder.current) return
    setState({ status: "starting" })
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.current = media
      const mimeType = pickMimeType()
      const rec = new MediaRecorder(media, mimeType ? { mimeType } : undefined)
      recorder.current = rec
      chunks.current = []
      rec.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data)
      }
      rec.start(250)
      startedAt.current = Date.now()
      setState({ status: "recording", startedAt: startedAt.current })
      limitTimer.current = setTimeout(() => {
        void finish().then((recording) => {
          if (recording) onAutoStopRef.current(recording)
        })
      }, maxMs)
    } catch (error) {
      release()
      setState({ status: "error", message: describeError(error) })
    }
  }, [finish, maxMs, release])

  const stop = useCallback(() => finish(), [finish])

  const cancel = useCallback(() => {
    const active = recorder.current
    if (active && active.state !== "inactive") {
      active.onstop = null
      active.stop()
    }
    release()
    setState({ status: "idle" })
  }, [release])

  const dismissError = useCallback(() => setState({ status: "idle" }), [])

  // Never leave the microphone on after unmount (e.g. switching conversation).
  useEffect(() => cancel, [cancel])

  return { state, start, stop, cancel, dismissError }
}
