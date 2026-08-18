/**
 * Central env access for the app layer.
 * Convex vars are optional until realtime chat/call is wired.
 */
export const env = {
  convexUrl: import.meta.env.VITE_CONVEX_URL as string | undefined,
  isConvexConfigured: Boolean(import.meta.env.VITE_CONVEX_URL),
} as const
