/**
 * Wire contract with the server — single source of truth lives in
 * `server/utils/hub.ts` (also used by the Android client spec).
 * Type-only: nothing from the server is bundled into the web app.
 */
export type {
  ClientEvent,
  MessageDto,
  RoomDto,
  RoomMemberDto,
  ServerEvent,
} from "../../../server/utils/hub"

export type UserDto = {
  id: string
  name: string
  email: string
  imageUrl: string | null
  createdAt: string
  locale: "en" | "fr"
}
