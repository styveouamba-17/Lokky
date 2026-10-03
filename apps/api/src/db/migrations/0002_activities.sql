CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"place_name" text NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"location" geography(Point, 4326) GENERATED ALWAYS AS ((ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography)) STORED,
	"neighborhood" text,
	"meeting_point" text,
	"capacity" integer NOT NULL,
	"cost_type" text NOT NULL,
	"cost_estimate_fcfa" integer,
	"creator_id" uuid NOT NULL,
	"city" text DEFAULT 'dakar' NOT NULL,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activities_capacity" CHECK ("activities"."capacity" between 2 and 20)
);
--> statement-breakpoint
CREATE TABLE "conversation_members" (
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"last_read_at" timestamp with time zone,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_members_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"activity_id" uuid,
	"direct_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_kind" CHECK (("conversations"."type" = 'group' and "conversations"."activity_id" is not null and "conversations"."direct_key" is null)
        or ("conversations"."type" = 'direct' and "conversations"."activity_id" is null and "conversations"."direct_key" is not null))
);
--> statement-breakpoint
CREATE TABLE "participations" (
	"activity_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"attended" boolean,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participations_activity_id_user_id_pk" PRIMARY KEY("activity_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_starts_at" ON "activities" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "activities_creator" ON "activities" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "activities_location" ON "activities" USING gist ("location");--> statement-breakpoint
CREATE INDEX "conversation_members_user" ON "conversation_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_activity" ON "conversations" USING btree ("activity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "conversations_direct_key" ON "conversations" USING btree ("direct_key");--> statement-breakpoint
CREATE INDEX "participations_user" ON "participations" USING btree ("user_id");