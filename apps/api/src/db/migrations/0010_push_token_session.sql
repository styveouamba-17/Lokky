ALTER TABLE "push_tokens" ADD COLUMN "session_family_id" uuid;--> statement-breakpoint
CREATE INDEX "push_tokens_session_family" ON "push_tokens" USING btree ("session_family_id");