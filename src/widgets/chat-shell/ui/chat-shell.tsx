import { ArrowLeft, LogOut, MessageSquarePlus, Settings } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"

import { CreateRoomForm } from "@/features/create-room"
import { MessageComposer } from "@/features/send-message"
import { SettingsPanel } from "@/features/settings"
import { roomTitle } from "@/entities/room"
import type { User } from "@/entities/user"
import { useI18n } from "@/shared/i18n"
import { springs } from "@/shared/lib/motion"
import { cn } from "@/shared/lib/utils"
import { Button, Desk, Paper, TornLabel } from "@/shared/ui"

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

/** A page turning around the spine (left edge): conversations and side panels. */
const pageTurn = {
  initial: { opacity: 0, rotateY: 14, x: 28 },
  animate: { opacity: 1, rotateY: 0, x: 0 },
  exit: { opacity: 0, rotateY: -10, x: -20 },
}

/**
 * The open correspondence notebook: the index of conversations on the left page,
 * the open conversation on the right page. On mobile only one page is visible at a time.
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

  const activeRoom = state.rooms.find((r) => r.id === state.activeRoomId)
  const now = useNow(30_000)

  // Names of the other people typing, per room (for the list, header and thread).
  const typingByRoom: Record<string, string[]> = {}
  for (const room of state.rooms) {
    const ids = typingUsers(state, room.id, user.id)
    if (ids.length) {
      typingByRoom[room.id] = ids.map(
        (id) => room.members.find((m) => m.id === id)?.name ?? t("chat.someone"),
      )
    }
  }

  return (
    <div className="relative flex h-svh w-full overflow-hidden md:p-4 lg:p-6">
      <Desk />

      <div className="notebook-cover relative z-10 mx-auto flex min-h-0 w-full max-w-[1320px] md:rounded-[10px_16px_16px_10px] md:p-2.5">
        <div className="relative flex min-h-0 w-full flex-1 [perspective:2200px]">
          {/* ---------- Left page: the index ---------- */}
          <Paper
            as="aside"
            seed={`index-${user.id}`}
            stains={2}
            className={cn(
              "flex w-full shrink-0 flex-col [perspective:1600px] md:w-[22rem] md:rounded-l-md lg:w-96",
              activeRoom && "hidden md:flex",
            )}
          >
            <header className="relative z-10 flex items-center gap-1 px-4 pt-4 pb-1">
              <button
                type="button"
                onClick={() => toggle("settings")}
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[var(--radius-hand)] text-left"
                aria-label={t("chat.settings")}
              >
                <Avatar name={user.name} seed={user.id} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-title text-xl leading-tight">{user.name}</span>
                  <ConnectionStatus status={state.connection} />
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("chat.newConversation")}
                aria-pressed={panel === "create"}
                onClick={() => toggle("create")}
              >
                <MessageSquarePlus />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("chat.settings")}
                aria-pressed={panel === "settings"}
                onClick={() => toggle("settings")}
              >
                <Settings />
              </Button>
              <Button variant="ghost" size="icon" aria-label={t("chat.signOut")} onClick={onLogout}>
                <LogOut />
              </Button>
            </header>

            <AnimatePresence mode="wait" initial={false}>
              {panel === "settings" ? (
                <motion.div
                  key="settings"
                  className="min-h-0 flex-1 overflow-y-auto px-4 pt-5 pb-4"
                  style={{ transformOrigin: "100% 50%" }}
                  {...pageTurn}
                  transition={springs.pageTurn}
                >
                  <SettingsPanel user={user} onUserChange={onUserChange} onClose={() => setPanel("rooms")} />
                </motion.div>
              ) : (
                <motion.div
                  key="rooms"
                  className="flex min-h-0 flex-1 flex-col"
                  style={{ transformOrigin: "100% 50%" }}
                  {...pageTurn}
                  transition={springs.pageTurn}
                >
                  <div className="px-4 pt-2">
                    <TornLabel tilt={-2} paperClassName="px-5 pt-1.5 pb-2">
                      <h2 className="m-0 font-title text-2xl font-normal">{t("chat.conversations")}</h2>
                    </TornLabel>
                  </div>

                  <AnimatePresence initial={false}>
                    {panel === "create" && (
                      <motion.div
                        key="create"
                        className="overflow-hidden"
                        initial={{ height: 0, opacity: 0, rotate: -2 }}
                        animate={{ height: "auto", opacity: 1, rotate: 0 }}
                        exit={{ height: 0, opacity: 0, rotate: 2 }}
                        transition={springs.pageTurn}
                      >
                        <div className="px-4 pt-6 pb-3">
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

                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {state.roomsStatus === "loading" && <Note>{t("chat.loadingRooms")}</Note>}
                    {state.roomsStatus === "error" && <Note>{t("chat.roomsFailed")}</Note>}
                    {state.roomsStatus === "ready" && state.rooms.length === 0 && panel !== "create" && (
                      <div className="flex flex-col items-center gap-4 p-6 text-center">
                        <Note>{t("chat.noRooms")}</Note>
                        <Button onClick={() => setPanel("create")}>{t("chat.newConversation")}</Button>
                      </div>
                    )}
                    <RoomList
                      rooms={state.rooms}
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
          </Paper>

          {/* ---------- The fold ---------- */}
          <div aria-hidden className="notebook-spine pointer-events-none relative z-20 -mx-3 hidden w-6 shrink-0 md:block" />

          {/* ---------- Right page: the open conversation ---------- */}
          <main className={cn("relative min-w-0 flex-1 flex-col", activeRoom ? "flex" : "hidden md:flex")}>
            {activeRoom ? (
              // Keyed by room: the page (list, composer draft, recorder) remounts and turns for each conversation.
              <motion.div
                key={activeRoom.id}
                className="flex min-h-0 flex-1 flex-col"
                style={{ transformOrigin: "0% 50%" }}
                initial={pageTurn.initial}
                animate={pageTurn.animate}
                transition={springs.pageTurn}
              >
                <Paper
                  seed={activeRoom.id}
                  lined
                  margin
                  className="flex min-h-0 flex-1 flex-col md:rounded-r-md"
                >
                  <header className="relative z-10 flex items-center gap-3 px-3 pt-3 pb-2 sm:px-5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden"
                      aria-label={t("chat.back")}
                      onClick={() => selectRoom(undefined)}
                    >
                      <ArrowLeft />
                    </Button>
                    <Avatar
                      name={roomTitle(activeRoom, user.id)}
                      seed={activeRoom.id}
                      className="size-11"
                      online={
                        activeRoom.type === "direct"
                          ? activeRoom.members.some((m) => m.id !== user.id && m.online)
                          : undefined
                      }
                    />
                    <TornLabel tilt={-1.2} className="min-w-0 max-w-full" paperClassName="px-5 pt-1.5 pb-2">
                      <p className="m-0 truncate font-title text-2xl leading-tight">{roomTitle(activeRoom, user.id)}</p>
                      <RoomStatus
                        room={activeRoom}
                        currentUserId={user.id}
                        typingNames={typingByRoom[activeRoom.id] ?? []}
                        now={now}
                      />
                    </TornLabel>
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
                </Paper>
              </motion.div>
            ) : (
              <Paper seed={`blank-${user.id}`} lined margin className="flex flex-1 items-center justify-center md:rounded-r-md">
                <p className="m-0 max-w-xs -rotate-2 px-6 text-center font-title text-2xl text-ink-soft">
                  <span aria-hidden className="mb-1 block text-4xl">←</span>
                  {t("chat.selectRoom")}
                </p>
              </Paper>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="m-0 px-5 py-4 text-base text-ink-soft">{children}</p>
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
  if (typing) {
    return <p className="m-0 truncate text-sm text-pink-ink italic">{typing}</p>
  }

  const others = room.members.filter((m) => m.id !== currentUserId)
  if (room.type === "direct") {
    const other = others.at(0)
    return (
      <p className="m-0 truncate text-sm text-ink-soft">
        {other ? format.presence(other, now) : t("presence.offline")}
      </p>
    )
  }

  const online = others.filter((m) => m.online).length
  return (
    <p className="m-0 truncate text-sm text-ink-soft">
      {online > 0
        ? t("room.membersOnline", { count: room.members.length, online })
        : t("room.members", { count: room.members.length })}
    </p>
  )
}

function ConnectionStatus({ status }: { status: "connecting" | "open" | "closed" }) {
  const { t } = useI18n()
  const label =
    status === "open"
      ? t("status.online")
      : status === "connecting"
        ? t("status.connecting")
        : t("status.offline")
  return (
    <span className="flex items-center gap-1.5 text-sm text-ink-soft">
      <span
        className={cn(
          "size-2.5 rounded-full border-[1.5px] border-ink",
          status === "open" ? "bg-green" : status === "connecting" ? "animate-pulse bg-yellow" : "bg-error-ink",
        )}
      />
      {label}
    </span>
  )
}
