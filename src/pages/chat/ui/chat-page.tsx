import { useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"

import { ChatShell } from "@/widgets/chat-shell"
import { logout } from "@/features/auth"
import type { User } from "@/entities/user"

export function ChatPage({ user }: { user: User }) {
  const navigate = useNavigate()

  const toLogin = useCallback(() => {
    void navigate({ to: "/login", replace: true })
  }, [navigate])

  const handleLogout = useCallback(async () => {
    await logout().catch(() => {})
    toLogin()
  }, [toLogin])

  return <ChatShell user={user} onLogout={handleLogout} onSessionExpired={toLogin} />
}
