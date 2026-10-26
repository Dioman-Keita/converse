import { Mic, SendHorizontal, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { FormEvent, KeyboardEvent } from "react"

import { formatDuration } from "@/entities/message"
import { canRecordVoice, useVoiceRecorder } from "@/shared/lib/use-voice-recorder"
import type { Recording } from "@/shared/lib/use-voice-recorder"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui"

const MAX_LENGTH = 4000
const MAX_VOICE_MS = 5 * 60 * 1000
// Below this, a tap on the mic is treated as accidental and discarded.
const MIN_VOICE_MS = 500

type MessageComposerProps = {
  onSend: (body: string) => void
  /** Voice notes are offered only when provided and the browser can record. */
  onSendVoice?: (recording: Recording) => void
  /** Called on every edit: true while there is text in the box, false once it's emptied. */
  onTyping?: (typing: boolean) => void
  disabled?: boolean
}

/**
 * Enter sends, Shift+Enter adds a new line.
 * With an empty box the send button becomes a microphone: tap to record, then send or discard.
 */
export function MessageComposer({ onSend, onSendVoice, onTyping, disabled }: MessageComposerProps) {
  const { t } = useI18n()
  const [value, setValue] = useState("")
  const textarea = useRef<HTMLTextAreaElement>(null)
  const [voiceSupported] = useState(canRecordVoice)

  const sendRecording = (recording: Recording | null) => {
    if (recording && recording.durationMs >= MIN_VOICE_MS) onSendVoice?.(recording)
  }
  const recorder = useVoiceRecorder({ maxMs: MAX_VOICE_MS, onAutoStop: sendRecording })
  const { state } = recorder

  function handleChange(next: string) {
    setValue(next)
    onTyping?.(next.trim().length > 0)
  }

  function submit(event?: FormEvent) {
    event?.preventDefault()
    const body = value.trim()
    if (!body || disabled) return
    onSend(body)
    setValue("")
    textarea.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  if (state.status === "recording" || state.status === "starting") {
    return (
      <div className="flex items-center gap-2 border-t border-border/60 bg-background/80 p-3 backdrop-blur-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("composer.cancelRecording")}
          onClick={recorder.cancel}
        >
          <Trash2 />
        </Button>
        <div className="flex min-h-9 flex-1 items-center gap-2 rounded-lg border border-input px-3 text-sm dark:bg-input/30">
          <span className="size-2.5 animate-pulse rounded-full bg-red-500" aria-hidden />
          {state.status === "starting" ? (
            <span className="text-muted-foreground">{t("composer.micStarting")}</span>
          ) : (
            <RecordingTimer startedAt={state.startedAt} />
          )}
        </div>
        <Button
          type="button"
          size="icon"
          aria-label={t("composer.sendVoice")}
          disabled={state.status !== "recording"}
          onClick={() => void recorder.stop().then(sendRecording)}
        >
          <SendHorizontal />
        </Button>
      </div>
    )
  }

  const showMic = voiceSupported && onSendVoice && !value.trim()

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 border-t border-border/60 bg-background/80 p-3 backdrop-blur-sm"
    >
      {state.status === "error" && (
        <p role="alert" className="flex items-center gap-2 text-xs text-destructive">
          {t(state.message)}
          <button type="button" className="underline" onClick={recorder.dismissError}>
            {t("common.ok")}
          </button>
        </p>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={textarea}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_LENGTH}
          rows={1}
          placeholder={t("composer.placeholder")}
          aria-label={t("composer.messageLabel")}
          className="field-sizing-content max-h-40 min-h-9 flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        />
        {showMic ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label={t("composer.record")}
            disabled={disabled}
            onClick={() => void recorder.start()}
          >
            <Mic />
          </Button>
        ) : (
          <Button type="submit" size="icon" disabled={disabled || !value.trim()} aria-label={t("composer.send")}>
            <SendHorizontal />
          </Button>
        )}
      </div>
    </form>
  )
}

function RecordingTimer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [])
  return (
    <span className="tabular-nums" aria-live="off">
      {formatDuration(now - startedAt)}
      <span className="text-muted-foreground"> / {formatDuration(MAX_VOICE_MS)}</span>
    </span>
  )
}
