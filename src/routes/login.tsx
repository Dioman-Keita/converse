import { createFileRoute } from "@tanstack/react-router"

import { AuthPage } from "@/pages/auth"

export const Route = createFileRoute("/login")({
  component: LoginRoute,
})

function LoginRoute() {
  return <AuthPage mode="signin" />
}
