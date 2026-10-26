CREATE TYPE "public"."media_status" AS ENUM('processing', 'ready', 'failed');--> statement-breakpoint
ALTER TYPE "public"."message_kind" ADD VALUE 'image';--> statement-breakpoint
ALTER TYPE "public"."message_kind" ADD VALUE 'video';--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_width" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_height" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_poster_path" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_status" "media_status";