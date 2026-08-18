/**
 * Domain types for User — will map to Convex `users` table.
 * Keep transport-agnostic so Convex / auth providers can plug in later.
 */
export type UserId = string

export type User = {
  id: UserId
  name: string
  email: string
  imageUrl?: string
  createdAt: number
}
