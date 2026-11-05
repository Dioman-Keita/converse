import { AnimatePresence } from "motion/react"
import { useState } from "react"
import type { ReactNode } from "react"

import type { ChatMessage } from "@/entities/message"
import type { Room } from "@/entities/room"
import { useI18n } from "@/shared/i18n"
import { tiltFor } from "@/shared/lib/seeded"
import { Button, Star, TornLabel } from "@/shared/ui"

import type { RoomHistory } from "../model/chat-state"
import { isSameDay, useFormatters } from "../lib/format"
import { Lightbox } from "./lightbox"
import { MessageItem } from "./message-item"
import { TypingScribble } from "./typing-scribble"

type MessageListProps = {
  room: Room
  history: RoomHistory | undefined
  currentUserId: string
  onLoadOlder: () => void
  onRetry: (message: ChatMessage) => void
  /** "Awa est en train d’écrire…" — shown as a note after the last message. */
  typingLabel?: string
}

/**
 * Uses `flex-col-reverse` so the browser keeps the view pinned to the newest
 * message, and prepending older pages doesn't make the content jump.
 *
 * `AnimatePresence initial={false}`: the history already there when the page opens
 * appears at rest; only messages arriving afterwards are laid down with a gesture.
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
    return (
      <Centered>
        <Star size={34} className="mx-auto mb-2" />
        {t("messages.empty")}
      </Centered>
    )
  }

  const names = new Map(room.members.map((m) => [m.id, m.name]))
  const items = history.items

  return (
    <div className="relative flex min-h-0 flex-1 flex-col-reverse overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-8">
      <ol className="flex flex-col gap-1">
        <AnimatePresence initial={false}>
          {history.nextCursor && (
            <li key="load-older" className="mb-3 flex justify-center">
              <Button variant="link" size="sm" onClick={onLoadOlder} disabled={history.loadingOlder}>
                {history.loadingOlder ? t("messages.loadingOlder") : t("messages.loadOlder")}
              </Button>
            </li>
          )}

          {items.map((message, i) => {
            const prev: ChatMessage | undefined = i > 0 ? items[i - 1] : undefined
            const mine = message.authorId === currentUserId
            const newDay = !prev || !isSameDay(prev.createdAt, message.createdAt)
            const newGroup = newDay || prev.authorId !== message.authorId
            const day = format.day(message.createdAt)
            return (
              <li key={message.clientId ?? message.id} className="flex flex-col">
                {newDay && (
                  <TornLabel
                    tilt={tiltFor(day, 2.5)}
                    className="my-4 self-center"
                    paperClassName="px-5 pt-1.5 pb-2 font-title text-lg"
                  >
                    {day}
                  </TornLabel>
                )}
                {newGroup && !mine && room.type === "group" && (
                  <p className="mt-2 mb-0 px-1.5 font-title text-lg leading-tight text-pink-ink">
                    {names.get(message.authorId) ?? t("messages.formerMember")}
                  </p>
                )}
                <MessageItem
                  message={message}
                  mine={mine}
                  newGroup={newGroup}
                  onRetry={onRetry}
                  onOpenImage={(src, alt) => setLightbox({ src, alt })}
                />
              </li>
            )
          })}

          {typingLabel && (
            <li key="typing" className="mt-2 flex items-center gap-2 self-start" aria-live="polite">
              <TypingScribble />
              <span className="text-sm text-ink-soft italic">{typingLabel}</span>
            </li>
          )}
        </AnimatePresence>
      </ol>
      <AnimatePresence>
        {lightbox && <Lightbox key="lightbox" {...lightbox} onClose={() => setLightbox(null)} />}
      </AnimatePresence>
    </div>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6 text-center">
      <p className="m-0 max-w-xs -rotate-1 text-xl text-ink-soft">{children}</p>
    </div>
  )
}
