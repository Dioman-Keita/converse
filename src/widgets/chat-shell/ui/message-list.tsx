import { MessagesSquare } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import type { ReactNode } from "react"

import type { ChatMessage } from "@/entities/message"
import type { Room } from "@/entities/room"
import { useI18n } from "@/shared/i18n"
import { fadeUp, transitions } from "@/shared/lib/motion"
import { Button, Spinner, TypingDots } from "@/shared/ui"

import type { RoomHistory } from "../model/chat-state"
import { isSameDay, useFormatters } from "../lib/format"
import { Avatar } from "./avatar"
import { Lightbox } from "./lightbox"
import { MessageItem } from "./message-item"

// Messages closer than this from the same author share one timestamp.
const GROUP_GAP_MS = 5 * 60 * 1000

type MessageListProps = {
  room: Room
  history: RoomHistory | undefined
  currentUserId: string
  onLoadOlder: () => void
  onRetry: (message: ChatMessage) => void
  /** "Awa is typing…" — shown as a bubble after the last message. */
  typingLabel?: string
}

/**
 * Uses `flex-col-reverse` so the browser keeps the view pinned to the newest
 * message, and prepending older pages doesn't make the content jump.
 *
 * `AnimatePresence initial={false}`: the history already there when the conversation
 * opens appears at rest; only messages arriving afterwards animate in.
 */
export function MessageList({ room, history, currentUserId, onLoadOlder, onRetry, typingLabel }: MessageListProps) {
  const { t } = useI18n()
  const format = useFormatters()
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null)
  if (!history || (history.status === "loading" && !history.items.length)) {
    return <Skeleton />
  }
  if (history.status === "error" && !history.items.length) {
    return (
      <Centered>
        <p className="m-0 text-sm text-gray-700">{t("messages.failed")}</p>
      </Centered>
    )
  }
  if (!history.items.length && !typingLabel) {
    return (
      <Centered>
        <motion.div className="flex flex-col items-center gap-3" {...fadeUp} transition={transitions.slow}>
          <span className="flex size-12 items-center justify-center rounded-xl border border-hairline-strong bg-gray-100 text-gray-800">
            <MessagesSquare className="size-5" />
          </span>
          <p className="m-0 text-sm font-medium text-gray-900">{t("messages.empty")}</p>
          <p className="m-0 max-w-xs text-[13px] text-gray-700">{t("messages.emptyHint")}</p>
        </motion.div>
      </Centered>
    )
  }

  const members = new Map(room.members.map((m) => [m.id, m]))
  const items = history.items
  const isGroup = room.type === "group"

  return (
    <div className="relative flex min-h-0 flex-1 flex-col-reverse overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-6">
      <ol className="mx-auto flex w-full max-w-3xl flex-col">
        <AnimatePresence initial={false}>
          {history.nextCursor && (
            <li key="load-older" className="mb-4 flex justify-center">
              <Button variant="secondary" size="xs" onClick={onLoadOlder} disabled={history.loadingOlder}>
                {history.loadingOlder && <Spinner className="size-3" />}
                {history.loadingOlder ? t("messages.loadingOlder") : t("messages.loadOlder")}
              </Button>
            </li>
          )}

          {items.map((message, i) => {
            const prev: ChatMessage | undefined = i > 0 ? items[i - 1] : undefined
            const next = items.at(i + 1)
            const mine = message.authorId === currentUserId
            const newDay = !prev || !isSameDay(prev.createdAt, message.createdAt)
            const newGroup = newDay || !sameRun(prev, message)
            const lastOfGroup = !next || !isSameDay(message.createdAt, next.createdAt) || !sameRun(message, next)
            const author = members.get(message.authorId)
            const showAuthor = isGroup && !mine
            return (
              <li key={message.clientId ?? message.id} className="flex flex-col">
                {newDay && <DaySeparator label={format.day(message.createdAt)} />}
                {newGroup && showAuthor && (
                  <p className="mt-3 mb-1 ml-10 text-xs font-medium text-gray-700">
                    {author?.name ?? t("messages.formerMember")}
                  </p>
                )}
                <div className={showAuthor ? "flex items-end gap-2" : "flex"}>
                  {showAuthor && (
                    <span className="w-8 shrink-0">
                      {lastOfGroup && (
                        <Avatar
                          name={author?.name ?? "?"}
                          seed={message.authorId}
                          className="size-8 text-[10px]"
                        />
                      )}
                    </span>
                  )}
                  <MessageItem
                    message={message}
                    mine={mine}
                    newGroup={newGroup}
                    lastOfGroup={lastOfGroup}
                    onRetry={onRetry}
                    onOpenImage={(src, alt) => setLightbox({ src, alt })}
                  />
                </div>
              </li>
            )
          })}

          {typingLabel && (
            <motion.li
              key="typing"
              className="mt-3 flex items-center gap-2 self-start"
              aria-live="polite"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={transitions.base}
            >
              <TypingDots />
              <span className="text-xs text-gray-700">{typingLabel}</span>
            </motion.li>
          )}
        </AnimatePresence>
      </ol>
      <AnimatePresence>
        {lightbox && <Lightbox key="lightbox" {...lightbox} onClose={() => setLightbox(null)} />}
      </AnimatePresence>
    </div>
  )
}

/** Same author, written within a few minutes: shown as one run of bubbles. */
function sameRun(a: ChatMessage, b: ChatMessage): boolean {
  return (
    a.authorId === b.authorId &&
    Math.abs(new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) < GROUP_GAP_MS
  )
}

function DaySeparator({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-3" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-hairline-strong" />
      <span className="font-mono text-[11px] tracking-wider text-gray-600 uppercase">{label}</span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-hairline-strong" />
    </div>
  )
}

/** Placeholder bubbles while the first page loads. */
function Skeleton() {
  const rows = [
    { mine: false, w: "w-52" },
    { mine: false, w: "w-72" },
    { mine: true, w: "w-44" },
    { mine: false, w: "w-60" },
    { mine: true, w: "w-64" },
    { mine: true, w: "w-36" },
  ]
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-end gap-2 overflow-hidden px-3 py-4 sm:px-6" aria-busy>
      {rows.map((row, i) => (
        <div key={i} className={row.mine ? "flex justify-end" : "flex"}>
          <span className={`shimmer h-9 max-w-[70%] rounded-2xl ${row.w}`} />
        </div>
      ))}
    </div>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 items-center justify-center p-6 text-center">{children}</div>
}
