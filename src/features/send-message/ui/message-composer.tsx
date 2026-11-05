import { ImagePlus, Mic, Paperclip, SendHorizontal, Trash2 } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useRef, useState } from "react"
import type { FormEvent, KeyboardEvent } from "react"

import { formatDuration } from "@/entities/message"
import { canRecordVoice, useVoiceRecorder } from "@/shared/lib/use-voice-recorder"
import type { Recording } from "@/shared/lib/use-voice-recorder"
import { useI18n } from "@/shared/i18n"
import { springs } from "@/shared/lib/motion"
import { Button } from "@/shared/ui"

const MAX_LENGTH = 4000
// Must match the server limits (server/utils/images.ts, videos.ts).
const MAX_IMAGE_MB = 25
const MAX_VIDEO_MB = 95
const MAX_FILE_MB = 95
const MAX_VOICE_MS = 5 * 60 * 1000
// Below this, a tap on the mic is treated as accidental and discarded.
const MIN_VOICE_MS = 500

type MessageComposerProps = {
  onSend: (body: string) => void
  /** Voice notes are offered only when provided and the browser can record. */
  onSendVoice?: (recording: Recording) => void
  /** Photos and videos are offered only when provided. */
  onSendMedia?: (file: File) => void
  /** Documents (any file, sent as-is) are offered only when provided. */
  onSendFile?: (file: File) => void
  /** Called on every edit: true while there is text in the box, false once it's emptied. */
  onTyping?: (typing: boolean) => void
  disabled?: boolean
}

/**
 * Enter sends, Shift+Enter adds a new line.
 * With an empty box the send button becomes a microphone: tap to record, then send or discard.
 * Looks like a lined scrap of paper at the foot of the page; the send/mic sticker swaps with a flick.
 */
export function MessageComposer({
  onSend,
  onSendVoice,
  onSendMedia,
  onSendFile,
  onTyping,
  disabled,
}: MessageComposerProps) {
  const { t } = useI18n()
  const [value, setValue] = useState("")
  const textarea = useRef<HTMLTextAreaElement>(null)
  const [voiceSupported] = useState(canRecordVoice)

  const sendRecording = (recording: Recording | null) => {
    if (recording && recording.durationMs >= MIN_VOICE_MS) onSendVoice?.(recording)
  }
  const recorder = useVoiceRecorder({ maxMs: MAX_VOICE_MS, onAutoStop: sendRecording })
  const fileInput = useRef<HTMLInputElement>(null)
  const documentInput = useRef<HTMLInputElement>(null)
  const [mediaError, setMediaError] = useState<string>()

  function pickDocuments(files: FileList | null) {
    if (!files || !onSendFile) return
    setMediaError(undefined)
    for (const file of files) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setMediaError(t("file.tooLarge", { name: file.name, max: MAX_FILE_MB }))
        continue
      }
      onSendFile(file)
    }
  }

  // Checked here too so nobody uploads 95 MB just to be told it's too big.
  function pickFiles(files: FileList | null) {
    if (!files || !onSendMedia) return
    setMediaError(undefined)
    for (const file of files) {
      const isVideo = file.type.startsWith("video/")
      const isImage = file.type.startsWith("image/") && file.type !== "image/svg+xml"
      if (!isVideo && !isImage) {
        setMediaError(t("media.unsupported", { name: file.name }))
        continue
      }
      const maxMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB
      if (file.size > maxMb * 1024 * 1024) {
        setMediaError(t("media.tooLarge", { name: file.name, max: maxMb }))
        continue
      }
      onSendMedia(file)
    }
  }
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
      <div className="relative z-10 flex items-center gap-2 px-3 pt-2 pb-3 sm:px-5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("composer.cancelRecording")}
          onClick={recorder.cancel}
        >
          <Trash2 />
        </Button>
        <div className="note flex min-h-11 flex-1 items-center gap-2.5 px-4 text-base">
          <span className="size-3 animate-pulse rounded-full border-[1.5px] border-ink bg-error-ink" aria-hidden />
          {state.status === "starting" ? (
            <span className="text-ink-soft">{t("composer.micStarting")}</span>
          ) : (
            <RecordingTimer startedAt={state.startedAt} />
          )}
        </div>
        <Button
          type="button"
          size="icon"
          variant="pink"
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
      className="relative z-10 flex flex-col gap-1.5 px-3 pt-2 pb-3 sm:px-5"
    >
      {mediaError && (
        <p role="alert" className="m-0 flex items-center gap-2 px-1 text-sm text-error-ink">
          {mediaError}
          <button type="button" className="underline" onClick={() => setMediaError(undefined)}>
            {t("common.ok")}
          </button>
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" className="m-0 flex items-center gap-2 px-1 text-sm text-error-ink">
          {t(state.message)}
          <button type="button" className="underline" onClick={recorder.dismissError}>
            {t("common.ok")}
          </button>
        </p>
      )}
      <div className="note flex items-end gap-1 py-1.5 pr-1.5 pl-1">
        {onSendFile && (
          <>
            <input
              ref={documentInput}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                pickDocuments(e.target.files)
                e.target.value = ""
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={t("composer.attachFile")}
              disabled={disabled}
              onClick={() => documentInput.current?.click()}
            >
              <Paperclip />
            </Button>
          </>
        )}
        {onSendMedia && (
          <>
            <input
              ref={fileInput}
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              onChange={(e) => {
                pickFiles(e.target.files)
                e.target.value = ""
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={t("composer.attach")}
              disabled={disabled}
              onClick={() => fileInput.current?.click()}
            >
              <ImagePlus />
            </Button>
          </>
        )}
        <textarea
          ref={textarea}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_LENGTH}
          rows={1}
          placeholder={t("composer.placeholder")}
          aria-label={t("composer.messageLabel")}
          className="hand-lines field-sizing-content max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2 pt-1.5 pb-0.5 text-base text-ink outline-none placeholder:text-ink-soft/70 focus-visible:outline-none"
        />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={showMic ? "mic" : "send"}
            className="flex"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            transition={springs.pop}
          >
            {showMic ? (
              <Button
                type="button"
                size="icon"
                variant="pink"
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
          </motion.span>
        </AnimatePresence>
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
      <span className="text-ink-soft"> / {formatDuration(MAX_VOICE_MS)}</span>
    </span>
  )
}
