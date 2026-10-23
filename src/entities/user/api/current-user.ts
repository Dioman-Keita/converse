import { ApiError, api } from "@/shared/api"

import type { User } from "../model/types"

/** The signed-in user, or `null` when there is no valid session. */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { user } = await api<{ user: User }>("/api/auth/me")
    return user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}
