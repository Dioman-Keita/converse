/**
 * Chat shell widget — composition point for future realtime UI.
 *
 * Planned composition (FSD widgets layer):
 * - entities/room list sidebar
 * - entities/message list
 * - features/send-message composer
 * - features/start-call controls
 *
 * Data will stream from the `/ws` endpoint (server/routes/ws.ts)
 * via entity/feature hooks; history comes from `/api/rooms/:id/messages`.
 */
export function ChatShellPlaceholder() {
  return null
}
