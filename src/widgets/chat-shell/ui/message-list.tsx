import { AlertCircle, Clock } from "lucide-react"
import { useState } from "react"

import { FileAttachment, MediaAttachment, VoicePlayer } from "@/entities/message"
import type { ChatMessage } from "@/entities/message"
import type { Room } from "@/entities/room"
import { useI18n } from "@/shared/i18n"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui"

import type { RoomHistory } from "../model/chat-state"
import { isSameDay, useFormatters } from "../lib/format"
import { Lightbox } from "./lightbox"

type MessageListProps = {
  room: Room
  history: RoomHistory | undefined
  currentUserId: string
  onLoadOlder: () => void
  onRetry: (message: ChatMessage) => void
  /** "Awa est en train d’écrire…" — shown as a bubble after the last message. */
  typingLabel?: string
}

/**
 * Uses `flex-col-reverse` so the browser keeps the view pinned to the newest
 * message, and prepending older pages doesn't make the content jump.
 */
export function MessageList({
  room,
  history,
  currentUserId,
  onLoadOlder,
  onRetry,
  typingLabel,
}: MessageListProps) {
  const { t } = useI18n()
  const format = useFormatters()
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)
  if (!history || (history.status === "loading" && !history.items.length)) {
    return <Centered>{t("messages.loading")}</Centered>
  }
  if (history.status === "error" && !history.items.length) {
    return <Centered>{t("messages.failed")}</Centered>
  }
  if (!history.items.length && !typingLabel) {
    return <Centered>{t("messages.empty")}</Centered>
  }

  const names = new Map(room.members.map((m) => [m.id, m.name]))
  const items = history.items

  return (
    <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto px-3 py-4 sm:px-6">
      <ol className="flex flex-col gap-0.5">
        {history.nextCursor && (
          <li className="mb-3 flex justify-center">
            <Button variant="ghost" size="sm" onClick={onLoadOlder} disabled={history.loadingOlder}>
              {history.loadingOlder ? t("messages.loadingOlder") : t("messages.loadOlder")}
            </Button>
          </li>
        )}

        {items.map((message, i) => {
          const prev: ChatMessage | undefined = i > 0 ? items[i - 1] : undefined
          const mine = message.authorId === currentUserId
          const newDay = !prev || !isSameDay(prev.createdAt, message.createdAt)
          const newGroup = newDay || prev.authorId !== message.authorId
          return (
            <li key={message.clientId ?? message.id} className="flex flex-col">
              {newDay && (
                <p className="my-3 self-center rounded-full bg-muted/60 px-3 py-0.5 text-xs text-muted-foreground">
                  {format.day(message.createdAt)}
                </p>
              )}
              {newGroup && !mine && room.type === "group" && (
                <p className="mt-2 mb-0.5 px-1 text-xs font-medium text-muted-foreground">
                  {names.get(message.authorId) ?? t("messages.formerMember")}
                </p>
              )}
              <div
                className={cn(
                  "group flex max-w-[85%] flex-col sm:max-w-[70%]",
                  mine ? "items-end self-end" : "items-start self-start",
                  newGroup && "mt-1.5",
                )}
              >
                {message.kind === "file" ? (
                  <div
                    className={cn(
                      "max-w-full rounded-2xl",
                      message.status === "failed" && "opacity-60 ring-2 ring-destructive/60",
                    )}
                  >
                    <FileAttachment message={message} mine={mine && message.status !== "failed"} />
                  </div>
                ) : message.kind === "image" || message.kind === "video" ? (
                  <div
                    className={cn(
                      "max-w-full rounded-xl",
                      message.status === "failed" && "opacity-60 ring-2 ring-destructive/60",
                    )}
                  >
                    <MediaAttachment
                      message={message}
                      onOpenImage={(src, alt) => setLightbox({ src, alt })}
                    />
                  </div>
                ) : (
                <div
                  className={cn(
                    "rounded-2xl px-3 py-1.5 text-sm break-words whitespace-pre-wrap",
                    mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                    message.status === "pending" && "opacity-70",
                    message.status === "failed" && "bg-destructive/15 text-foreground ring-1 ring-destructive/50",
                  )}
                >
                  {message.kind === "voice" && message.voice ? (
                    <VoicePlayer
                      src={message.voice.url}
                      durationMs={message.voice.durationMs}
                      mine={mine && message.status !== "failed"}
                    />
                  ) : (
                    message.body
                  )}
                </div>
                )}
                <span className="mt-0.5 flex items-center gap-1 px-1 text-[0.7rem] text-muted-foreground">
                  {message.status === "pending" && <Clock className="size-3" aria-label={t("messages.sending")} />}
                  {message.status === "failed" ? (
                    <button
                      type="button"
                      onClick={() => onRetry(message)}
                      className="flex items-center gap-1 text-destructive hover:underline"
                    >
                      <AlertCircle className="size-3" />
                      {t("messages.failedRetry")}
                    </button>
                  ) : (
                    format.time(message.createdAt)
                  )}
                </span>
              </div>
            </li>
          )
        })}

        {typingLabel && (
          <li className="mt-2 flex items-center gap-2 self-start" aria-live="polite">
            <span className="flex items-center gap-1 rounded-2xl bg-muted px-3 py-2.5" aria-hidden>
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
            <span className="text-xs text-muted-foreground italic">{typingLabel}</span>
          </li>
        )}
      </ol>
      {lightbox && <Lightbox {...lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}
