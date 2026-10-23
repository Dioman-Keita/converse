import { AlertCircle, Clock } from "lucide-react"

import type { ChatMessage } from "@/entities/message"
import type { Room } from "@/entities/room"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui"

import type { RoomHistory } from "../model/chat-state"
import { formatDay, formatTime, isSameDay } from "../lib/format"

type MessageListProps = {
  room: Room
  history: RoomHistory | undefined
  currentUserId: string
  onLoadOlder: () => void
  onRetry: (message: ChatMessage) => void
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
}: MessageListProps) {
  if (!history || (history.status === "loading" && !history.items.length)) {
    return <Centered>Loading messages…</Centered>
  }
  if (history.status === "error" && !history.items.length) {
    return <Centered>Couldn&apos;t load messages. Check your connection.</Centered>
  }
  if (!history.items.length) {
    return <Centered>No messages yet — say hi 👋</Centered>
  }

  const names = new Map(room.members.map((m) => [m.id, m.name]))
  const items = history.items

  return (
    <div className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto px-3 py-4 sm:px-6">
      <ol className="flex flex-col gap-0.5">
        {history.nextCursor && (
          <li className="mb-3 flex justify-center">
            <Button variant="ghost" size="sm" onClick={onLoadOlder} disabled={history.loadingOlder}>
              {history.loadingOlder ? "Loading…" : "Load older messages"}
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
                  {formatDay(message.createdAt)}
                </p>
              )}
              {newGroup && !mine && room.type === "group" && (
                <p className="mt-2 mb-0.5 px-1 text-xs font-medium text-muted-foreground">
                  {names.get(message.authorId) ?? "Former member"}
                </p>
              )}
              <div
                className={cn(
                  "group flex max-w-[85%] flex-col sm:max-w-[70%]",
                  mine ? "items-end self-end" : "items-start self-start",
                  newGroup && "mt-1.5",
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-3 py-1.5 text-sm break-words whitespace-pre-wrap",
                    mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                    message.status === "pending" && "opacity-70",
                    message.status === "failed" && "bg-destructive/15 text-foreground ring-1 ring-destructive/50",
                  )}
                >
                  {message.body}
                </div>
                <span className="mt-0.5 flex items-center gap-1 px-1 text-[0.7rem] text-muted-foreground">
                  {message.status === "pending" && <Clock className="size-3" aria-label="Sending" />}
                  {message.status === "failed" ? (
                    <button
                      type="button"
                      onClick={() => onRetry(message)}
                      className="flex items-center gap-1 text-destructive hover:underline"
                    >
                      <AlertCircle className="size-3" />
                      Not sent — tap to retry
                    </button>
                  ) : (
                    formatTime(message.createdAt)
                  )}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
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
