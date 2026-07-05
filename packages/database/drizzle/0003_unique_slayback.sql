ALTER TABLE "animes" ADD COLUMN "anilist_id" integer;--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN "banner_url" text;--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN "anilist_popularity" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "animes_anilist_id_unique_idx" ON "animes" USING btree ("anilist_id");--> statement-breakpoint
CREATE INDEX "animes_anilist_popularity_idx" ON "animes" USING btree ("anilist_popularity" DESC NULLS LAST);