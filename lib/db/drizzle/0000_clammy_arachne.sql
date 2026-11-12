DO $$ BEGIN
  CREATE TYPE "public"."item_status" AS ENUM('want_to_watch', 'watching', 'watched');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."item_type" AS ENUM('movie', 'series');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_lower_username_idx" ON "users" (lower("username"));
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_lower_email_idx" ON "users" (lower("email"));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "watchlist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"tmdb_id" integer,
	"title" text NOT NULL,
	"type" "item_type" NOT NULL,
	"genre" text,
	"year" integer,
	"poster_url" text,
	"description" text,
	"status" "item_status" DEFAULT 'want_to_watch' NOT NULL,
	"rating" integer,
	"notes" text,
	"season_progress" integer DEFAULT 1 NOT NULL,
	"episode_progress" integer DEFAULT 0 NOT NULL,
	"total_seasons" integer,
	"total_episodes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD COLUMN IF NOT EXISTS "user_id" integer;
--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD COLUMN IF NOT EXISTS "tmdb_id" integer;
--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD COLUMN IF NOT EXISTS "season_progress" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD COLUMN IF NOT EXISTS "episode_progress" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD COLUMN IF NOT EXISTS "total_seasons" integer;
--> statement-breakpoint
ALTER TABLE "watchlist_items" ADD COLUMN IF NOT EXISTS "total_episodes" integer;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "watchlist_items_user_tmdb_unique" ON "watchlist_items" ("user_id", "tmdb_id") WHERE "tmdb_id" IS NOT NULL;
