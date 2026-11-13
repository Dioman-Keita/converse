import { Clock, RotateCw } from "lucide-react"
import { motion } from "motion/react"

import { FileAttachment, MediaAttachment, VoicePlayer } from "@/entities/message"
import type { ChatMessage } from "@/entities/message"
import { useI18n } from "@/shared/i18n"
import { springs, transitions } from "@/shared/lib/motion"
import { cn } from "@/shared/lib/utils"

import { useFormatters } from "../lib/format"

type MessageItemProps = {
  message: ChatMessage
  mine: boolean
  /** First message of a run by the same author (adds breathing room). */
  newGroup: boolean
  /** Last message of the run: carries the timestamp and the tail corner. */
  lastOfGroup: boolean
  onRetry: (message: ChatMessage) => void
  onOpenImage: (src: string, alt: string) => void
}

/**
 * One message. Mine are light and aligned right, the others' a raised dark surface
 * on the left; a run of messages by the same author shares one tail and one timestamp.
 * New messages rise from the composer side and settle.
 */
export function MessageItem({ message, mine, newGroup, lastOfGroup, onRetry, onOpenImage }: MessageItemProps) {
  const { t } = useI18n()
  const format = useFormatters()
  const isMedia = message.kind === "image" || message.kind === "video"
  const failed = message.status === "failed"
  const pending = message.status === "pending"

  return (
    <motion.div
      className={cn(
        "flex max-w-[85%] flex-col sm:max-w-[70%]",
        mine ? "ml-auto items-end" : "items-start",
        newGroup ? "mt-3" : "mt-0.5",
      )}
      style={{ transformOrigin: mine ? "100% 100%" : "0% 100%" }}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...springs.dialog, opacity: transitions.fast }}
      title={format.time(message.createdAt)}
    >
      {message.kind === "file" ? (
        <div className={cn("max-w-full", failed && "opacity-60")}>
          <FileAttachment message={message} mine={mine} />
        </div>
      ) : isMedia ? (
        <div className={cn("max-w-full", failed && "opacity-60")}>
          <MediaAttachment message={message} onOpenImage={onOpenImage} />
        </div>
      ) : (
        <div
          className={cn(
            "rounded-[18px] px-3.5 py-2 text-[14.5px] leading-[1.45] break-words whitespace-pre-wrap transition-opacity duration-200",
            mine ? "bg-bubble-mine text-bubble-mine-fg" : "bg-bubble-theirs text-bubble-theirs-fg",
            lastOfGroup && (mine ? "rounded-br-md" : "rounded-bl-md"),
            pending && "opacity-60",
            failed && "opacity-60 ring-1 ring-red/60",
          )}
        >
          {message.kind === "voice" && message.voice ? (
            <VoicePlayer
              src={message.voice.url}
              durationMs={message.voice.durationMs}
              seed={message.id}
              mine={mine}
            />
          ) : (
            message.body
          )}
        </div>
      )}
      {(lastOfGroup || pending || failed) && (
        <span className="mt-1 flex items-center gap-1.5 px-1 font-mono text-[11px] text-gray-600 tabular-nums">
          {pending && <Clock className="size-3" aria-label={t("messages.sending")} />}
          {failed ? (
            <button
              type="button"
              onClick={() => onRetry(message)}
              className="inline-flex items-center gap-1 font-sans text-xs text-red hover:underline"
            >
              <RotateCw className="size-3" aria-hidden />
              {t("messages.failedRetry")}
            </button>
          ) : (
            format.time(message.createdAt)
          )}
        </span>
      )}
    </motion.div>
  )
}
