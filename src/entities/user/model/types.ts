/**
 * Domain types for User — Postgres `users` table (server/db/schema.ts).
 * Keep transport-agnostic: shared by web and Android clients.
 */
export type UserId = string

export type User = {
  id: UserId
  name: string
  email: string
  imageUrl?: string
  createdAt: number
}
