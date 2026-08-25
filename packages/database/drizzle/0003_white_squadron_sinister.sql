ALTER TABLE "animes" ADD COLUMN IF NOT EXISTS "banner_url" text;--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN IF NOT EXISTS "anilist_id" integer;--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN IF NOT EXISTS "format" text;--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN IF NOT EXISTS "country_of_origin" text;--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN IF NOT EXISTS "start_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN IF NOT EXISTS "average_score" integer;--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN IF NOT EXISTS "anilist_popularity" integer;--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN IF NOT EXISTS "trending" integer;--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN IF NOT EXISTS "relevance_score" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN IF NOT EXISTS "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "animes_anilist_id_unique_idx" ON "animes" USING btree ("anilist_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "animes_relevance_score_idx" ON "animes" USING btree ("relevance_score" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "animes_format_country_relevance_idx" ON "animes" USING btree ("format","country_of_origin","relevance_score" DESC NULLS LAST);
