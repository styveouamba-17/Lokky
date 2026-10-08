CREATE TABLE "activity_participant_removals" (
	"activity_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"removed_by" uuid NOT NULL,
	"removed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_participant_removals_activity_id_user_id_pk" PRIMARY KEY("activity_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "activity_participant_removals" ADD CONSTRAINT "activity_participant_removals_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_participant_removals" ADD CONSTRAINT "activity_participant_removals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_participant_removals" ADD CONSTRAINT "activity_participant_removals_removed_by_users_id_fk" FOREIGN KEY ("removed_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;