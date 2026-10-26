import { ArrowLeft, LogOut, MessageSquarePlus, Settings } from "lucide-react"
import { useState } from "react"

import { CreateRoomForm } from "@/features/create-room"
import { MessageComposer } from "@/features/send-message"
import { SettingsPanel } from "@/features/settings"
import { roomTitle } from "@/entities/room"
import type { User } from "@/entities/user"
import { useI18n } from "@/shared/i18n"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui"

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
 * Two-pane chat: conversations on the left, the open conversation on the right.
 * On mobile only one pane is visible at a time.
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
    <div className="flex h-svh w-full overflow-hidden bg-background">
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-r border-border/60 md:w-80",
          activeRoom && "hidden md:flex",
        )}
      >
        <header className="flex items-center gap-1 border-b border-border/60 px-3 py-3">
          <button
            type="button"
            onClick={() => toggle("settings")}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left"
            aria-label={t("chat.settings")}
          >
            <Avatar name={user.name} seed={user.id} className="size-8" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user.name}</span>
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

        {panel === "settings" ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <SettingsPanel user={user} onUserChange={onUserChange} onClose={() => setPanel("rooms")} />
          </div>
        ) : (
          <>
            {panel === "create" && (
              <div className="border-b border-border/60 p-3">
                <CreateRoomForm
                  onCancel={() => setPanel("rooms")}
                  onCreated={(room) => {
                    addRoom(room)
                    setPanel("rooms")
                    selectRoom(room.id)
                  }}
                />
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto">
              {state.roomsStatus === "loading" && (
                <p className="p-4 text-sm text-muted-foreground">{t("chat.loadingRooms")}</p>
              )}
              {state.roomsStatus === "error" && (
                <p className="p-4 text-sm text-muted-foreground">{t("chat.roomsFailed")}</p>
              )}
              {state.roomsStatus === "ready" && state.rooms.length === 0 && panel !== "create" && (
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <p className="text-sm text-muted-foreground">{t("chat.noRooms")}</p>
                  <Button size="sm" onClick={() => setPanel("create")}>
                    {t("chat.newConversation")}
                  </Button>
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
          </>
        )}
      </aside>

      <main className={cn("min-w-0 flex-1 flex-col", activeRoom ? "flex" : "hidden md:flex")}>
        {activeRoom ? (
          <>
            <header className="flex items-center gap-3 border-b border-border/60 px-3 py-3">
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
                className="size-8"
                online={
                  activeRoom.type === "direct"
                    ? activeRoom.members.some((m) => m.id !== user.id && m.online)
                    : undefined
                }
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{roomTitle(activeRoom, user.id)}</p>
                <RoomStatus
                  room={activeRoom}
                  currentUserId={user.id}
                  typingNames={typingByRoom[activeRoom.id] ?? []}
                  now={now}
                />
              </div>
            </header>

            <MessageList
              key={activeRoom.id}
              room={activeRoom}
              history={state.history[activeRoom.id]}
              currentUserId={user.id}
              onLoadOlder={() => void loadOlder(activeRoom.id)}
              onRetry={retry}
              typingLabel={format.typing(typingByRoom[activeRoom.id] ?? [], false)}
            />

            <MessageComposer
              key={activeRoom.id}
              onSend={(body) => send(activeRoom.id, body)}
              onSendVoice={(recording) => sendVoice(activeRoom.id, recording)}
              onSendMedia={(file) => sendMedia(activeRoom.id, file)}
              onSendFile={(file) => sendMedia(activeRoom.id, file, true)}
              onTyping={(typing) => notifyTyping(activeRoom.id, typing)}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            {t("chat.selectRoom")}
          </div>
        )}
      </main>
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
  if (typing) {
    return <p className="truncate text-xs text-primary italic">{typing}</p>
  }

  const others = room.members.filter((m) => m.id !== currentUserId)
  if (room.type === "direct") {
    const other = others.at(0)
    return (
      <p className="truncate text-xs text-muted-foreground">
        {other ? format.presence(other, now) : t("presence.offline")}
      </p>
    )
  }

  const online = others.filter((m) => m.online).length
  return (
    <p className="truncate text-xs text-muted-foreground">
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
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "open" ? "bg-emerald-500" : status === "connecting" ? "bg-amber-500" : "bg-red-500",
        )}
      />
      {label}
    </span>
  )
}
