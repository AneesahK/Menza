CREATE TABLE "conversation" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"user_id" varchar(64),
	"org_id" varchar(64),
	"parent_conversation_id" varchar(64),
	"agent_type" varchar DEFAULT 'assistant' NOT NULL,
	"run_id" varchar,
	"status" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"entity_id" varchar,
	"title" varchar
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"user_id" varchar(64) NOT NULL,
	"org_id" varchar(64),
	"conversation_id" varchar(64) NOT NULL,
	"message" text,
	"attachments" text DEFAULT '[]',
	"role" varchar NOT NULL,
	"is_visible" boolean NOT NULL,
	"tool_call_id" varchar,
	"tool_calls" jsonb,
	"thinking_blocks" jsonb,
	"explanation" text,
	"run_id" varchar,
	"parent_run_id" varchar
);
--> statement-breakpoint
CREATE TABLE "org_member" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"user_id" varchar(64) NOT NULL,
	"org_id" varchar(64) NOT NULL,
	"role" varchar DEFAULT 'member' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widget" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"version" integer DEFAULT 2,
	"ai_prompt" text,
	"user_id" varchar(64) NOT NULL,
	"org_id" varchar(64),
	"conversation_id" varchar(64),
	"config" jsonb,
	"explanation" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"status" text NOT NULL,
	"is_pinned" boolean DEFAULT false,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"last_updated" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone
);
--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "fk__conversation__user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "fk__conversation__org_id" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation" ADD CONSTRAINT "fk__conversation__parent_conversation_id" FOREIGN KEY ("parent_conversation_id") REFERENCES "public"."conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "fk__message__user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "fk__message__org_id" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "fk__message__conversation_id" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member" ADD CONSTRAINT "fk__org_member__user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_member" ADD CONSTRAINT "fk__org_member__org_id" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget" ADD CONSTRAINT "fk__widget__user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget" ADD CONSTRAINT "fk__widget__org_id" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget" ADD CONSTRAINT "fk__widget__conversation_id" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx__conversation__user_id" ON "conversation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cidx__conversation__org_id__user_id" ON "conversation" USING btree ("org_id","user_id");--> statement-breakpoint
CREATE INDEX "cidx__conversation__org_id__entity_id__is_active" ON "conversation" USING btree ("org_id","entity_id","is_active");--> statement-breakpoint
CREATE INDEX "idx__conversation__parent_conversation_id" ON "conversation" USING btree ("parent_conversation_id");--> statement-breakpoint
CREATE INDEX "cidx__message__conversation_id__user_id__created_at" ON "message" USING btree ("conversation_id","user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "ucidx__org_member__user_id__org_id" ON "org_member" USING btree ("user_id","org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uidx__user__email" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "cidx__widget__org_id__conversation_id" ON "widget" USING btree ("org_id","conversation_id");