CREATE TABLE "moderation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid,
	"owner_id" text,
	"review_id" uuid,
	"book_title" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"state" text NOT NULL,
	"questions" jsonb NOT NULL,
	"input_snapshot" jsonb,
	"response" jsonb,
	"decision" "review_decision",
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"request_id" text,
	"http_status" integer,
	"error_code" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"input_usd_per_million" numeric(16, 6) NOT NULL,
	"estimated_cost_usd" numeric(20, 10),
	"started_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"completed_at" timestamp,
	"duration_ms" integer,
	CONSTRAINT "moderation_runs_review_id_unique" UNIQUE("review_id")
);
--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "moderation_runs" ADD CONSTRAINT "moderation_runs_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_runs" ADD CONSTRAINT "moderation_runs_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_runs" ADD CONSTRAINT "moderation_runs_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "moderation_runs_book_id_idx" ON "moderation_runs" USING btree ("book_id");--> statement-breakpoint
CREATE INDEX "moderation_runs_owner_id_idx" ON "moderation_runs" USING btree ("owner_id");