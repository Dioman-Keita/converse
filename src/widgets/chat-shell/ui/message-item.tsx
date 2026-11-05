import { Clock } from "lucide-react"
import { motion } from "motion/react"

import { FileAttachment, MediaAttachment, VoicePlayer } from "@/entities/message"
import type { ChatMessage } from "@/entities/message"
import { useI18n } from "@/shared/i18n"
import { lift, springs } from "@/shared/lib/motion"
import { tiltFor } from "@/shared/lib/seeded"
import { cn } from "@/shared/lib/utils"

import { useFormatters } from "../lib/format"

type MessageItemProps = {
  message: ChatMessage
  mine: boolean
  /** First message of a run by the same author (adds breathing room). */
  newGroup: boolean
  onRetry: (message: ChatMessage) => void
  onOpenImage: (src: string, alt: string) => void
}

/**
 * One message, laid on the page like a note: own notes are washed in pink and
 * lean from the right, the others' in pale blue from the left. Photos and videos
 * are taped polaroids. Each item keeps the same small tilt forever (seeded by its id).
 */
export function MessageItem({ message, mine, newGroup, onRetry, onOpenImage }: MessageItemProps) {
  const { t } = useI18n()
  const format = useFormatters()
  const isMedia = message.kind === "image" || message.kind === "video"
  const failed = message.status === "failed"
  const tilt = tiltFor(message.clientId ?? message.id, isMedia ? 2.5 : 0.9)

  return (
    <motion.div
      className={cn(
        "flex max-w-[85%] flex-col sm:max-w-[70%]",
        mine ? "items-end self-end" : "items-start self-start",
        newGroup && "mt-2",
        isMedia && "my-2",
      )}
      style={{ transformOrigin: mine ? "100% 100%" : "0% 100%" }}
      initial={{ opacity: 0, y: 16, scale: 0.94, rotate: tilt + (mine ? 5 : -5) }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: tilt }}
      whileHover={isMedia && !message.upload ? lift : undefined}
      transition={isMedia ? springs.polaroid : springs.note}
    >
      {message.kind === "file" ? (
        <div className={cn("max-w-full", failed && "note-failed opacity-70")}>
          <FileAttachment message={message} mine={mine && !failed} />
        </div>
      ) : isMedia ? (
        <div className={cn("max-w-full", failed && "note-failed opacity-70")}>
          <MediaAttachment message={message} onOpenImage={onOpenImage} />
        </div>
      ) : (
        <div
          className={cn(
            "note px-3.5 py-1.5 text-base break-words whitespace-pre-wrap",
            mine ? "note-mine" : "note-theirs",
            message.status === "pending" && "opacity-70",
            failed && "note-failed",
          )}
        >
          {message.kind === "voice" && message.voice ? (
            <VoicePlayer src={message.voice.url} durationMs={message.voice.durationMs} mine={mine && !failed} />
          ) : (
            message.body
          )}
        </div>
      )}
      <span className="mt-0.5 flex items-center gap-1 px-1.5 text-xs text-ink-soft">
        {message.status === "pending" && <Clock className="rough size-3.5" aria-label={t("messages.sending")} />}
        {failed ? (
          <button
            type="button"
            onClick={() => onRetry(message)}
            className="text-sm text-error-ink underline decoration-dashed underline-offset-4 hover:decoration-solid"
          >
            ✗ {t("messages.failedRetry")}
          </button>
        ) : (
          format.time(message.createdAt)
        )}
      </span>
    </motion.div>
  )
}
