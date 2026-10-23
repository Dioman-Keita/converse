import { createFileRoute, redirect } from "@tanstack/react-router"

import { ChatPage } from "@/pages/chat"
import { fetchCurrentUser } from "@/entities/user"

export const Route = createFileRoute("/chat")({
  // Client-only: the session check and the WebSocket both need the browser's cookie.
  ssr: false,
  beforeLoad: async () => {
    const user = await fetchCurrentUser()
    if (!user) throw redirect({ to: "/login" })
    return { user }
  },
  component: ChatRoute,
})

function ChatRoute() {
  const { user } = Route.useRouteContext()
  return <ChatPage user={user} />
}
