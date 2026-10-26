import { useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useState } from "react"

import { ChatShell } from "@/widgets/chat-shell"
import { logout } from "@/features/auth"
import type { User } from "@/entities/user"
import { useI18n } from "@/shared/i18n"

export function ChatPage({ user: initialUser }: { user: User }) {
  const navigate = useNavigate()
  const { setLocale } = useI18n()
  const [user, setUser] = useState(initialUser)

  // The account's language wins over the one remembered on this device.
  useEffect(() => {
    setLocale(initialUser.locale)
  }, [initialUser.locale, setLocale])

  const toLogin = useCallback(() => {
    void navigate({ to: "/login", replace: true })
  }, [navigate])

  const handleLogout = useCallback(async () => {
    await logout().catch(() => {})
    toLogin()
  }, [toLogin])

  return (
    <ChatShell
      user={user}
      onUserChange={setUser}
      onLogout={handleLogout}
      onSessionExpired={toLogin}
    />
  )
}
