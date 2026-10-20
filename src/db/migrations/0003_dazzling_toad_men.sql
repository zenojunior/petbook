ALTER TABLE "books" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_share_token_unique" UNIQUE("share_token");