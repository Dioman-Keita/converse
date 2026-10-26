import type { User } from "@/entities/user"
import { api } from "@/shared/api"
import type { Locale } from "@/shared/i18n"

export type SettingsChanges = { name?: string; locale?: Locale }

/** Saves profile settings on the account (they follow the user across devices). */
export async function updateSettings(changes: SettingsChanges): Promise<User> {
  const { user } = await api<{ user: User }>("/api/auth/me", { method: "PATCH", json: changes })
  return user
}
