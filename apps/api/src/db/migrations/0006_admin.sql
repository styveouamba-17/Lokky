CREATE TABLE "admin_audit" (
	"id" uuid PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "moderation_events" ADD COLUMN "actor_id" uuid;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "subject_user_id" uuid;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "handled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "handled_by" uuid;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "staff_role" text;--> statement-breakpoint
ALTER TABLE "admin_audit" ADD CONSTRAINT "admin_audit_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_target" ON "admin_audit" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "admin_audit_created" ON "admin_audit" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "admin_sessions_user" ON "admin_sessions" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "moderation_events" ADD CONSTRAINT "moderation_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_subject_user_id_users_id_fk" FOREIGN KEY ("subject_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "moderation_events_user" ON "moderation_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "reports_target" ON "reports" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "reports_subject" ON "reports" USING btree ("subject_user_id","status");--> statement-breakpoint
-- Signalements déjà enregistrés : compte concerné retrouvé à partir de la cible.
UPDATE "reports" r SET "subject_user_id" = CASE r."target_type"
  WHEN 'user' THEN (SELECT u."id" FROM "users" u WHERE u."id"::text = r."target_id")
  WHEN 'message' THEN (SELECT m."sender_id" FROM "messages" m WHERE m."id"::text = r."target_id")
  WHEN 'activity' THEN (SELECT a."creator_id" FROM "activities" a WHERE a."id"::text = r."target_id")
END;
