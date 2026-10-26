ALTER TYPE "public"."message_kind" ADD VALUE 'file';--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_name" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_size" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_mime" text;