import type { User } from "@/entities/user"
import { api } from "@/shared/api"

import type { LoginCredentials, RegisterCredentials } from "../model/types"

// The server sets the httpOnly session cookie; the returned token is for native clients.
type AuthResponse = { user: User; token: string }

export async function login(credentials: LoginCredentials): Promise<User> {
  const { user } = await api<AuthResponse>("/api/auth/login", { json: credentials })
  return user
}

export async function register({
  name,
  email,
  password,
}: RegisterCredentials): Promise<User> {
  const { user } = await api<AuthResponse>("/api/auth/register", {
    json: { name, email, password },
  })
  return user
}

export async function logout(): Promise<void> {
  await api("/api/auth/logout", { method: "POST" })
}
