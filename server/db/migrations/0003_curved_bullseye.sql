CREATE TYPE "public"."message_kind" AS ENUM('text', 'voice');--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "kind" "message_kind" DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_path" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_duration_ms" integer;