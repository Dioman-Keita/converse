DROP INDEX "messages_room_time_idx";--> statement-breakpoint
CREATE INDEX "messages_room_time_idx" ON "messages" USING btree ("room_id","created_at","id");