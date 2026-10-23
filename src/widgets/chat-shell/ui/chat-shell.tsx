import { ArrowLeft, LogOut, MessageSquarePlus } from "lucide-react"
import { useState } from "react"

import { CreateRoomForm } from "@/features/create-room"
import { MessageComposer } from "@/features/send-message"
import { roomTitle } from "@/entities/room"
import type { User } from "@/entities/user"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui"

import { useChat } from "../model/use-chat"
import { Avatar } from "./avatar"
import { MessageList } from "./message-list"
import { RoomList } from "./room-list"

type ChatShellProps = {
  user: User
  onLogout: () => void
  onSessionExpired: () => void
}

/**
 * Two-pane chat: conversations on the left, the open conversation on the right.
 * On mobile only one pane is visible at a time.
 */
export function ChatShell({ user, onLogout, onSessionExpired }: ChatShellProps) {
  const { state, selectRoom, loadOlder, send, retry, addRoom } = useChat(
    user.id,
    onSessionExpired,
  )
  const [creating, setCreating] = useState(false)

  const activeRoom = state.rooms.find((r) => r.id === state.activeRoomId)

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background">
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-r border-border/60 md:w-80",
          activeRoom && "hidden md:flex",
        )}
      >
        <header className="flex items-center gap-2 border-b border-border/60 px-3 py-3">
          <Avatar name={user.name} seed={user.id} className="size-8" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <ConnectionStatus status={state.connection} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Nouvelle conversation"
            onClick={() => setCreating((v) => !v)}
          >
            <MessageSquarePlus />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Se déconnecter" onClick={onLogout}>
            <LogOut />
          </Button>
        </header>

        {creating && (
          <div className="border-b border-border/60 p-3">
            <CreateRoomForm
              onCancel={() => setCreating(false)}
              onCreated={(room) => {
                addRoom(room)
                setCreating(false)
                selectRoom(room.id)
              }}
            />
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {state.roomsStatus === "loading" && (
            <p className="p-4 text-sm text-muted-foreground">Chargement des conversations…</p>
          )}
          {state.roomsStatus === "error" && (
            <p className="p-4 text-sm text-muted-foreground">Impossible de charger les conversations.</p>
          )}
          {state.roomsStatus === "ready" && state.rooms.length === 0 && !creating && (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune conversation pour l&apos;instant. Démarrez-en une avec l&apos;email d&apos;une personne inscrite.
              </p>
              <Button size="sm" onClick={() => setCreating(true)}>
                Nouvelle conversation
              </Button>
            </div>
          )}
          <RoomList
            rooms={state.rooms}
            currentUserId={user.id}
            activeRoomId={state.activeRoomId}
            unread={state.unread}
            onSelect={selectRoom}
          />
        </div>
      </aside>

      <main className={cn("min-w-0 flex-1 flex-col", activeRoom ? "flex" : "hidden md:flex")}>
        {activeRoom ? (
          <>
            <header className="flex items-center gap-3 border-b border-border/60 px-3 py-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Retour aux conversations"
                onClick={() => selectRoom(undefined)}
              >
                <ArrowLeft />
              </Button>
              <Avatar name={roomTitle(activeRoom, user.id)} seed={activeRoom.id} className="size-8" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{roomTitle(activeRoom, user.id)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {activeRoom.members
                    .filter((m) => m.id !== user.id)
                    .map((m) => (activeRoom.type === "direct" ? m.email : m.name))
                    .join(", ")}
                </p>
              </div>
            </header>

            <MessageList
              key={activeRoom.id}
              room={activeRoom}
              history={state.history[activeRoom.id]}
              currentUserId={user.id}
              onLoadOlder={() => void loadOlder(activeRoom.id)}
              onRetry={retry}
            />

            <MessageComposer onSend={(body) => send(activeRoom.id, body)} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Sélectionnez une conversation
          </div>
        )}
      </main>
    </div>
  )
}

function ConnectionStatus({ status }: { status: "connecting" | "open" | "closed" }) {
  const label = status === "open" ? "En ligne" : status === "connecting" ? "Connexion…" : "Hors ligne — reconnexion"
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "open" ? "bg-emerald-500" : status === "connecting" ? "bg-amber-500" : "bg-red-500",
        )}
      />
      {label}
    </p>
  )
}
