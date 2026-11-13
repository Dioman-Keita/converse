import { ArrowUp, CircleAlert, ImagePlus, Mic, Paperclip, Trash2 } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useRef, useState } from "react"
import type { FormEvent, KeyboardEvent } from "react"

import { formatDuration } from "@/entities/message"
import { canRecordVoice, useVoiceRecorder } from "@/shared/lib/use-voice-recorder"
import type { Recording } from "@/shared/lib/use-voice-recorder"
import { useI18n } from "@/shared/i18n"
import { springs, transitions } from "@/shared/lib/motion"
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
 * A floating field at the foot of the thread; the send and mic buttons swap with a quick scale.
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
      <div className="px-3 pb-3 sm:px-6 sm:pb-4">
        <motion.div
          className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-red/30 bg-gray-50 p-1.5 shadow-md"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitions.base}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl"
            aria-label={t("composer.cancelRecording")}
            onClick={recorder.cancel}
          >
            <Trash2 />
          </Button>
          <div className="flex min-h-9 flex-1 items-center gap-3 px-1 text-sm">
            <span className="relative flex size-2.5" aria-hidden>
              <span className="absolute inset-0 animate-ping rounded-full bg-red opacity-60" />
              <span className="relative size-2.5 rounded-full bg-red" />
            </span>
            {state.status === "starting" ? (
              <span className="text-gray-700">{t("composer.micStarting")}</span>
            ) : (
              <>
                <RecordingTimer startedAt={state.startedAt} />
                <LiveBars />
              </>
            )}
          </div>
          <Button
            type="button"
            size="icon"
            className="rounded-xl"
            aria-label={t("composer.sendVoice")}
            disabled={state.status !== "recording"}
            onClick={() => void recorder.stop().then(sendRecording)}
          >
            <ArrowUp />
          </Button>
        </motion.div>
      </div>
    )
  }

  const showMic = voiceSupported && onSendVoice && !value.trim()
  const error = mediaError ?? (state.status === "error" ? t(state.message) : undefined)

  return (
    <form onSubmit={submit} className="px-3 pb-3 sm:px-6 sm:pb-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        <AnimatePresence initial={false}>
          {error && (
            <motion.p
              key="error"
              role="alert"
              className="m-0 flex items-center gap-2 rounded-lg border border-red/25 bg-red-soft px-3 py-2 text-[13px] text-red"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={transitions.fast}
            >
              <CircleAlert className="size-4 shrink-0" aria-hidden />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                className="font-medium hover:underline"
                onClick={() => {
                  setMediaError(undefined)
                  if (state.status === "error") recorder.dismissError()
                }}
              >
                {t("common.ok")}
              </button>
            </motion.p>
          )}
        </AnimatePresence>
        <div className="flex items-end gap-1 rounded-2xl border border-hairline-strong bg-gray-50 p-1.5 shadow-md transition-[border-color,box-shadow] duration-150 focus-within:border-gray-500">
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
                className="rounded-xl"
                aria-label={t("composer.attachFile")}
                title={t("composer.attachFile")}
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
                className="rounded-xl"
                aria-label={t("composer.attach")}
                title={t("composer.attach")}
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
            className="field-sizing-content max-h-48 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-[14.5px] leading-5 text-gray-900 outline-none placeholder:text-gray-600 focus-visible:shadow-none"
          />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={showMic ? "mic" : "send"}
              className="flex"
              initial={{ scale: 0.6, opacity: 0, filter: "blur(2px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              exit={{ scale: 0.6, opacity: 0, filter: "blur(2px)" }}
              transition={springs.pop}
            >
              {showMic ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="rounded-xl"
                  aria-label={t("composer.record")}
                  title={t("composer.record")}
                  disabled={disabled}
                  onClick={() => void recorder.start()}
                >
                  <Mic />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-xl"
                  disabled={disabled || !value.trim()}
                  aria-label={t("composer.send")}
                >
                  <ArrowUp />
                </Button>
              )}
            </motion.span>
          </AnimatePresence>
        </div>
        <p className="m-0 hidden px-2 font-mono text-[11px] text-gray-600 md:block">{t("composer.hint")}</p>
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
    <span className="font-mono text-[13px] text-gray-900 tabular-nums" aria-live="off">
      {formatDuration(now - startedAt)}
      <span className="text-gray-600"> / {formatDuration(MAX_VOICE_MS)}</span>
    </span>
  )
}

/** Bars dancing while the microphone records (decorative, not the real input level). */
function LiveBars() {
  return (
    <span className="ml-auto flex h-5 items-center gap-[3px] pr-2" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-gray-700"
          animate={{ height: ["25%", "100%", "40%", "80%", "25%"] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: (i % 7) * 0.09, ease: "easeInOut" }}
        />
      ))}
    </span>
  )
}
