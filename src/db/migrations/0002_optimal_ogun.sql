CREATE TYPE "public"."cover_color" AS ENUM('sage', 'sky', 'lavender', 'rose', 'peach', 'butter', 'terracotta', 'forest', 'navy', 'cocoa');--> statement-breakpoint
CREATE TYPE "public"."cover_pattern" AS ENUM('plain', 'stripes', 'dots', 'paws', 'check');--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "cover_color" "cover_color" DEFAULT 'sage' NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "cover_pattern" "cover_pattern" DEFAULT 'paws' NOT NULL;