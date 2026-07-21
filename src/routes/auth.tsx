import { AuthDashboard } from '@/pages/auth/auth'
import { createFileRoute } from '@tanstack/react-router'
import { InitialModeType } from '@/entities/auth/model'

export const Route = createFileRoute('/auth')({
  component: AuthRootPage,
})

export function AuthRoutPage(mode: InitialModeType) {

}
