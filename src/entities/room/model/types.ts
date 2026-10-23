import type { RoomDto, RoomMemberDto } from "@/shared/api"

/**
 * Domain types for conversation rooms — Postgres `rooms` table (server/db/schema.ts).
 */
export type RoomId = string

export type RoomType = RoomDto["type"]

export type Room = RoomDto

export type RoomMember = RoomMemberDto
