/**
 * Postgres schema (Drizzle) — source of truth for Converse data.
 * Mirrors domain types under `src/entities/*`.
 *
 * Migrations: `npm run db:generate` then `npm run db:migrate`.
 */
import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

// Interface language, chosen in Settings (English by default).
export const userLocale = pgEnum("user_locale", ["en", "fr"])

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  // Last time the user had a live connection (set on connect and on disconnect).
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  locale: userLocale("locale").notNull().default("en"),
})

export const sessions = pgTable(
  "sessions",
  {
    // SHA-256 of the session token — the raw token only lives in the client cookie.
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
)

export const roomType = pgEnum("room_type", ["direct", "group"])

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: roomType("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
})

export const roomMembers = pgTable(
  "room_members",
  {
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.roomId, t.userId] }),
    index("room_members_user_idx").on(t.userId),
  ],
)

export const messageKind = pgEnum("message_kind", ["text", "voice", "image", "video"])

// Videos are converted after upload; images and voice notes are ready at once.
export const mediaStatus = pgEnum("media_status", ["processing", "ready", "failed"])

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: messageKind("kind").notNull().default("text"),
    // Empty for voice messages.
    body: text("body").notNull(),
    // Media (voice, image, video): file path relative to UPLOADS_DIR, served by
    // /api/media/:messageId; videos also have a poster frame.
    mediaPath: text("media_path"),
    mediaDurationMs: integer("media_duration_ms"),
    mediaWidth: integer("media_width"),
    mediaHeight: integer("media_height"),
    mediaPosterPath: text("media_poster_path"),
    mediaStatus: mediaStatus("media_status"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("messages_room_time_idx").on(t.roomId, t.createdAt, t.id)],
)
