CREATE TABLE "anime_episodes_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"anime_id" integer NOT NULL,
	"page" integer NOT NULL,
	"data" jsonb NOT NULL,
	"cached_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "anime_episodes_cache" ADD CONSTRAINT "anime_episodes_cache_anime_id_animes_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."animes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "anime_episodes_cache_anime_page_unique_idx" ON "anime_episodes_cache" USING btree ("anime_id","page");--> statement-breakpoint
CREATE INDEX "anime_episodes_cache_anime_idx" ON "anime_episodes_cache" USING btree ("anime_id");