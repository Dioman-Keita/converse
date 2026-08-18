/**
 * Convex schema scaffold for Converse realtime chat & call.
 *
 * Activate with:
 *   bun add convex
 *   bunx convex dev
 *
 * Tables mirror FSD entities under `src/entities/*`.
 * Until Convex is installed this file is documentation + future source of truth.
 *
 * Realtime strategy:
 * - Chat messages: `messages` table + `useQuery` subscriptions
 * - Rooms/membership: `rooms` + optional join table for scale
 * - Calls: signaling/presence in `calls`; media via LiveKit/WebRTC SFU
 * - Presence/typing: short-lived docs or Convex presence helpers
 */

// Uncomment after `bun add convex`:
//
// import { defineSchema, defineTable } from "convex/server"
// import { v } from "convex/values"
//
// export default defineSchema({
//   users: defineTable({
//     name: v.string(),
//     email: v.string(),
//     imageUrl: v.optional(v.string()),
//     tokenIdentifier: v.optional(v.string()),
//   })
//     .index("by_email", ["email"])
//     .index("by_token", ["tokenIdentifier"]),
//
//   rooms: defineTable({
//     name: v.string(),
//     type: v.union(v.literal("direct"), v.literal("group")),
//     memberIds: v.array(v.id("users")),
//     lastMessageAt: v.optional(v.number()),
//   }).index("by_last_message", ["lastMessageAt"]),
//
//   messages: defineTable({
//     roomId: v.id("rooms"),
//     authorId: v.id("users"),
//     body: v.string(),
//   })
//     .index("by_room", ["roomId"])
//     .index("by_room_time", ["roomId"]),
//
//   calls: defineTable({
//     roomId: v.id("rooms"),
//     initiatorId: v.id("users"),
//     participantIds: v.array(v.id("users")),
//     status: v.union(
//       v.literal("ringing"),
//       v.literal("active"),
//       v.literal("ended"),
//       v.literal("missed"),
//     ),
//     startedAt: v.optional(v.number()),
//     endedAt: v.optional(v.number()),
//   })
//     .index("by_room", ["roomId"])
//     .index("by_status", ["status"]),
// })

export {}
