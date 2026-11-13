import { ArrowLeft, LogOut, MessagesSquare, Search, Settings, SquarePen, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useRef, useState } from "react"

import { CreateRoomForm } from "@/features/create-room"
import { MessageComposer } from "@/features/send-message"
import { SettingsPanel } from "@/features/settings"
import { roomTitle } from "@/entities/room"
import type { User } from "@/entities/user"
import { useI18n } from "@/shared/i18n"
import { fadeUp, slideIn, transitions } from "@/shared/lib/motion"
import { cn } from "@/shared/lib/utils"
import { Button, Logo } from "@/shared/ui"

import { typingUsers } from "../model/chat-state"
import type { ChatState } from "../model/chat-state"
import { useChat } from "../model/use-chat"
import { useFormatters } from "../lib/format"
import { useNow } from "../lib/presence"
import { Avatar } from "./avatar"
import { MessageList } from "./message-list"
import { RoomList } from "./room-list"

type ChatShellProps = {
  user: User
  onUserChange: (user: User) => void
  onLogout: () => void
  onSessionExpired: () => void
}

type SidePanel = "rooms" | "create" | "settings"

/**
 * Two columns: conversations on the left, the open conversation on the right.
 * On mobile only one column is visible at a time.
 */
export function ChatShell({ user, onUserChange, onLogout, onSessionExpired }: ChatShellProps) {
  const { t } = useI18n()
  const format = useFormatters()
  const { state, selectRoom, loadOlder, send, sendVoice, sendMedia, retry, addRoom, notifyTyping } = useChat(
    user.id,
    onSessionExpired,
  )
  const [panel, setPanel] = useState<SidePanel>("rooms")
  const toggle = (next: SidePanel) => setPanel((current) => (current === next ? "rooms" : next))
  const [query, setQuery] = useState("")
  const search = useRef<HTMLInputElement>(null)

  const activeRoom = state.rooms.find((r) => r.id === state.activeRoomId)
  const now = useNow(30_000)

  // Ctrl/⌘ + K jumps to the conversation search from anywhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setPanel("rooms")
        // On phones the list is hidden behind the open conversation: go back to it.
        if (!window.matchMedia("(min-width: 768px)").matches) selectRoom(undefined)
        requestAnimationFrame(() => search.current?.focus())
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [selectRoom])

  // Names of the other people typing, per room (for the list, header and thread).
  const typingByRoom: Record<string, string[]> = {}
  for (const room of state.rooms) {
    const ids = typingUsers(state, room.id, user.id)
    if (ids.length) {
      typingByRoom[room.id] = ids.map((id) => room.members.find((m) => m.id === id)?.name ?? t("chat.someone"))
    }
  }

  const needle = query.trim().toLowerCase()
  const visibleRooms = needle
    ? state.rooms.filter((room) =>
        [roomTitle(room, user.id), ...room.members.map((m) => m.email)].some((text) =>
          text.toLowerCase().includes(needle),
        ),
      )
    : state.rooms

  return (
    <div className="flex h-svh w-full overflow-hidden bg-gray-0">
      {/* ---------- Sidebar ---------- */}
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-r border-hairline bg-gray-50 md:w-80 lg:w-[22rem]",
          activeRoom && "hidden md:flex",
        )}
      >
        <header className="flex h-14 shrink-0 items-center gap-1 border-b border-hairline px-3">
          <Logo className="mr-auto pl-1" />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("chat.newConversation")}
            title={t("chat.newConversation")}
            aria-pressed={panel === "create"}
            onClick={() => toggle("create")}
          >
            <SquarePen />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("chat.settings")}
            title={t("chat.settings")}
            aria-pressed={panel === "settings"}
            onClick={() => toggle("settings")}
          >
            <Settings />
          </Button>
        </header>

        <div className="relative min-h-0 flex-1">
          <AnimatePresence mode="popLayout" initial={false}>
            {panel === "settings" ? (
              <motion.div
                key="settings"
                className="absolute inset-0 overflow-y-auto px-4 py-5"
                {...slideIn}
                transition={transitions.base}
              >
                <SettingsPanel user={user} onUserChange={onUserChange} onClose={() => setPanel("rooms")} />
              </motion.div>
            ) : (
              <motion.div
                key="rooms"
                className="absolute inset-0 flex flex-col"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={transitions.base}
              >
                <div className="px-3 pt-3 pb-2">
                  <label className="group relative flex items-center">
                    <span className="sr-only">{t("chat.search")}</span>
                    <Search className="pointer-events-none absolute left-2.5 size-4 text-gray-600" aria-hidden />
                    <input
                      ref={search}
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setQuery("")
                      }}
                      placeholder={t("chat.search")}
                      className="h-8 w-full rounded-md border border-hairline bg-gray-0 pr-14 pl-8 text-[13px] text-gray-900 transition-[border-color,box-shadow] outline-none placeholder:text-gray-600 hover:border-hairline-strong focus-visible:border-gray-600 focus-visible:shadow-focus [&::-webkit-search-cancel-button]:hidden"
                    />
                    {query ? (
                      <button
                        type="button"
                        aria-label={t("common.cancel")}
                        onClick={() => setQuery("")}
                        className="absolute right-1.5 flex size-5 items-center justify-center rounded text-gray-700 hover:text-gray-900"
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : (
                      <kbd className="pointer-events-none absolute right-2 hidden rounded border border-hairline-strong bg-gray-100 px-1.5 font-mono text-[10px] leading-4 text-gray-700 md:block">
                        Ctrl K
                      </kbd>
                    )}
                  </label>
                </div>

                <AnimatePresence initial={false}>
                  {panel === "create" && (
                    <motion.div
                      key="create"
                      className="overflow-hidden"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={transitions.base}
                    >
                      <div className="px-3 pb-3">
                        <CreateRoomForm
                          onCancel={() => setPanel("rooms")}
                          onCreated={(room) => {
                            addRoom(room)
                            setPanel("rooms")
                            selectRoom(room.id)
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between px-5 pt-2 pb-1.5">
                  <h2 className="m-0 text-[11px] font-medium tracking-wider text-gray-600 uppercase">
                    {t("chat.conversations")}
                  </h2>
                  {state.rooms.length > 0 && (
                    <span className="font-mono text-[11px] text-gray-600 tabular-nums">{visibleRooms.length}</span>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pb-2">
                  {state.roomsStatus === "loading" && <RoomsSkeleton />}
                  {state.roomsStatus === "error" && <Note>{t("chat.roomsFailed")}</Note>}
                  {state.roomsStatus === "ready" && state.rooms.length === 0 && panel !== "create" && (
                    <div className="flex flex-col items-start gap-3 px-5 py-4">
                      <p className="m-0 text-[13px] text-gray-700">{t("chat.noRooms")}</p>
                      <Button size="sm" variant="secondary" onClick={() => setPanel("create")}>
                        <SquarePen />
                        {t("chat.newConversation")}
                      </Button>
                    </div>
                  )}
                  {needle && visibleRooms.length === 0 && state.rooms.length > 0 && (
                    <Note>{t("chat.noMatch", { query: query.trim() })}</Note>
                  )}
                  <RoomList
                    rooms={visibleRooms}
                    currentUserId={user.id}
                    activeRoomId={state.activeRoomId}
                    unread={state.unread}
                    typingByRoom={typingByRoom}
                    onSelect={selectRoom}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---------- Account ---------- */}
        <footer className="flex h-14 shrink-0 items-center gap-2.5 border-t border-hairline px-3">
          <button
            type="button"
            onClick={() => toggle("settings")}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md p-1 text-left transition-colors hover:bg-gray-100"
            aria-label={t("chat.settings")}
          >
            <Avatar name={user.name} seed={user.id} className="size-8 text-[10px]" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] leading-tight font-medium text-gray-900">{user.name}</span>
              <ConnectionStatus status={state.connection} />
            </span>
          </button>
          <Button variant="ghost" size="icon-sm" aria-label={t("chat.signOut")} title={t("chat.signOut")} onClick={onLogout}>
            <LogOut />
          </Button>
        </footer>
      </aside>

      {/* ---------- Conversation ---------- */}
      <main className={cn("relative min-w-0 flex-1 flex-col", activeRoom ? "flex" : "hidden md:flex")}>
        {/* popLayout + an absolutely placed empty state: an outgoing view never pushes the new one down (on phones it is hidden, so its exit never plays out). */}
        <AnimatePresence mode="popLayout" initial={false}>
          {activeRoom ? (
            // Keyed by room: the thread (list, composer draft, recorder) remounts for each conversation.
            <motion.div
              key={activeRoom.id}
              className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={transitions.base}
            >
              <header className="flex h-14 shrink-0 items-center gap-3 border-b border-hairline bg-gray-0/80 px-3 backdrop-blur sm:px-5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="md:hidden"
                  aria-label={t("chat.back")}
                  onClick={() => selectRoom(undefined)}
                >
                  <ArrowLeft />
                </Button>
                <Avatar
                  name={roomTitle(activeRoom, user.id)}
                  seed={
                    activeRoom.type === "direct"
                      ? (activeRoom.members.find((m) => m.id !== user.id)?.id ?? activeRoom.id)
                      : activeRoom.id
                  }
                  online={
                    activeRoom.type === "direct"
                      ? activeRoom.members.some((m) => m.id !== user.id && m.online)
                      : undefined
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-sm leading-tight font-semibold tracking-[-0.01em] text-gray-900">
                    {roomTitle(activeRoom, user.id)}
                  </p>
                  <RoomStatus
                    room={activeRoom}
                    currentUserId={user.id}
                    typingNames={typingByRoom[activeRoom.id] ?? []}
                    now={now}
                  />
                </div>
              </header>

              <MessageList
                room={activeRoom}
                history={state.history[activeRoom.id]}
                currentUserId={user.id}
                onLoadOlder={() => void loadOlder(activeRoom.id)}
                onRetry={retry}
                typingLabel={format.typing(typingByRoom[activeRoom.id] ?? [], false)}
              />

              <MessageComposer
                onSend={(body) => send(activeRoom.id, body)}
                onSendVoice={(recording) => sendVoice(activeRoom.id, recording)}
                onSendMedia={(file) => sendMedia(activeRoom.id, file)}
                onSendFile={(file) => sendMedia(activeRoom.id, file, true)}
                onTyping={(typing) => notifyTyping(activeRoom.id, typing)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitions.base}
            >
              <div aria-hidden className="grid-backdrop absolute inset-0 opacity-60" />
              <motion.div
                className="relative flex flex-col items-center gap-3 px-6 text-center"
                {...fadeUp}
                transition={transitions.slow}
              >
                <span className="edge-light flex size-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-900 shadow-md">
                  <MessagesSquare className="size-6" />
                </span>
                <p className="m-0 mt-2 text-base font-semibold tracking-[-0.01em] text-gray-900">
                  {t("chat.selectRoom")}
                </p>
                <p className="m-0 max-w-xs text-sm text-gray-700">{t("chat.selectRoomHint")}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={() => setPanel("create")}
                >
                  <SquarePen />
                  {t("chat.newConversation")}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="m-0 px-5 py-3 text-[13px] text-gray-700">{children}</p>
}

function RoomsSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-2 py-1" aria-busy>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-2.5 py-2">
          <span className="shimmer size-9 shrink-0 rounded-full" />
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="shimmer h-3 w-2/3 rounded" />
            <span className="shimmer h-2.5 w-1/2 rounded" />
          </span>
        </div>
      ))}
    </div>
  )
}

/** Header subtitle: typing, else presence (direct) or member count (group). */
function RoomStatus({
  room,
  currentUserId,
  typingNames,
  now,
}: {
  room: ChatState["rooms"][number]
  currentUserId: string
  typingNames: string[]
  now: number
}) {
  const { t } = useI18n()
  const format = useFormatters()
  const typing = format.typing(typingNames, room.type === "direct")
  let text: string
  let tone = "text-gray-700"
  if (typing) {
    text = typing
    tone = "text-blue"
  } else if (room.type === "direct") {
    const other = room.members.filter((m) => m.id !== currentUserId).at(0)
    text = other ? format.presence(other, now) : t("presence.offline")
    if (other?.online) tone = "text-green"
  } else {
    const online = room.members.filter((m) => m.id !== currentUserId && m.online).length
    text =
      online > 0
        ? t("room.membersOnline", { count: room.members.length, online })
        : t("room.members", { count: room.members.length })
  }
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.p
        key={text}
        className={cn("m-0 truncate text-xs", tone)}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -3 }}
        transition={transitions.fast}
      >
        {text}
      </motion.p>
    </AnimatePresence>
  )
}

function ConnectionStatus({ status }: { status: "connecting" | "open" | "closed" }) {
  const { t } = useI18n()
  const label =
    status === "open" ? t("status.online") : status === "connecting" ? t("status.connecting") : t("status.offline")
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-gray-700">
      <span className="relative flex size-1.5">
        {status !== "closed" && (
          <span
            className={cn(
              "absolute inset-0 animate-ping rounded-full opacity-60",
              status === "open" ? "bg-green" : "bg-amber",
            )}
            style={{ animationDuration: status === "open" ? "2.4s" : "1s" }}
          />
        )}
        <span
          className={cn(
            "relative size-1.5 rounded-full",
            status === "open" ? "bg-green" : status === "connecting" ? "bg-amber" : "bg-red",
          )}
        />
      </span>
      <span className="truncate">{label}</span>
    </span>
  )
}
