CREATE TYPE "public"."user_locale" AS ENUM('en', 'fr');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locale" "user_locale" DEFAULT 'en' NOT NULL;