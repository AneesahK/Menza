CREATE TABLE "user_memory" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3) with time zone,
	"user_id" varchar(64) NOT NULL,
	"org_id" varchar(64),
	"content" text NOT NULL,
	"embedding" jsonb,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "user_memory" ADD CONSTRAINT "fk__user_memory__user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_memory" ADD CONSTRAINT "fk__user_memory__org_id" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx__user_memory__user_id" ON "user_memory" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cidx__user_memory__org_id__user_id" ON "user_memory" USING btree ("org_id","user_id");--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "instructions";