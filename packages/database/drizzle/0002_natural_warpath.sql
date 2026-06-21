CREATE TABLE "addon_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"addon_id" uuid,
	"addon_url" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anime_episodes" (
	"anime_id" integer NOT NULL,
	"season" integer DEFAULT 1 NOT NULL,
	"episode" integer NOT NULL,
	"title" text,
	"thumbnail_url" text,
	"aired_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "anime_episodes_anime_id_season_episode_pk" PRIMARY KEY("anime_id","season","episode")
);
--> statement-breakpoint
CREATE TABLE "anime_genres" (
	"anime_id" integer NOT NULL,
	"genre" text NOT NULL,
	CONSTRAINT "anime_genres_anime_id_genre_pk" PRIMARY KEY("anime_id","genre")
);
--> statement-breakpoint
CREATE TABLE "anime_user_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"anime_id" integer,
	"event_type" text NOT NULL,
	"season" integer,
	"episode" integer,
	"query" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "animes" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_english" text,
	"title_japanese" text,
	"synopsis" text,
	"image_url" text,
	"trailer_url" text,
	"episodes" integer,
	"status" text,
	"score" numeric(4, 2),
	"scored_by" integer,
	"rank" integer,
	"popularity" integer,
	"year" integer,
	"season" text,
	"studio" text,
	"rating" text,
	"duration" text,
	"source" text,
	"mal_id" integer NOT NULL,
	"kitsu_id" text,
	"imdb_id" text,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"manifest" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_anime_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"anime_id" integer NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_anime_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"anime_id" integer NOT NULL,
	"season" integer DEFAULT 1 NOT NULL,
	"episode" integer NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"progress_seconds" integer DEFAULT 0 NOT NULL,
	"watched" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_stream_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"anime_id" integer NOT NULL,
	"season" integer DEFAULT 1 NOT NULL,
	"episode" integer NOT NULL,
	"addon_name" text NOT NULL,
	"stream_title" text NOT NULL,
	"stream_url" text NOT NULL,
	"used_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "addon_reports" ADD CONSTRAINT "addon_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addon_reports" ADD CONSTRAINT "addon_reports_addon_id_user_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."user_addons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_episodes" ADD CONSTRAINT "anime_episodes_anime_id_animes_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."animes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_genres" ADD CONSTRAINT "anime_genres_anime_id_animes_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."animes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_user_events" ADD CONSTRAINT "anime_user_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_user_events" ADD CONSTRAINT "anime_user_events_anime_id_animes_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."animes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_addons" ADD CONSTRAINT "user_addons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_anime_lists" ADD CONSTRAINT "user_anime_lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_anime_lists" ADD CONSTRAINT "user_anime_lists_anime_id_animes_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."animes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_anime_progress" ADD CONSTRAINT "user_anime_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_anime_progress" ADD CONSTRAINT "user_anime_progress_anime_id_animes_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."animes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stream_history" ADD CONSTRAINT "user_stream_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stream_history" ADD CONSTRAINT "user_stream_history_anime_id_animes_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."animes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "addon_reports_addon_idx" ON "addon_reports" USING btree ("addon_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "anime_episodes_air_date_idx" ON "anime_episodes" USING btree ("aired_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "anime_user_events_user_created_at_idx" ON "anime_user_events" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "anime_user_events_anime_created_at_idx" ON "anime_user_events" USING btree ("anime_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "anime_user_events_type_created_at_idx" ON "anime_user_events" USING btree ("event_type","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "anime_user_events_created_at_idx" ON "anime_user_events" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "animes_mal_id_unique_idx" ON "animes" USING btree ("mal_id");--> statement-breakpoint
CREATE INDEX "animes_score_idx" ON "animes" USING btree ("score" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "animes_popularity_idx" ON "animes" USING btree ("popularity");--> statement-breakpoint
CREATE INDEX "animes_year_idx" ON "animes" USING btree ("year" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "animes_status_idx" ON "animes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "animes_search_idx" ON "animes" USING gin (to_tsvector('spanish', coalesce("title", '') || ' ' || coalesce("synopsis", '')));--> statement-breakpoint
CREATE INDEX "user_addons_user_created_at_idx" ON "user_addons" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "user_anime_lists_unique_anime_idx" ON "user_anime_lists" USING btree ("user_id","anime_id");--> statement-breakpoint
CREATE INDEX "user_anime_lists_user_status_idx" ON "user_anime_lists" USING btree ("user_id","status","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "user_anime_progress_unique_episode_idx" ON "user_anime_progress" USING btree ("user_id","anime_id","season","episode");--> statement-breakpoint
CREATE INDEX "user_anime_progress_continue_idx" ON "user_anime_progress" USING btree ("user_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "user_anime_progress_user_anime_idx" ON "user_anime_progress" USING btree ("user_id","anime_id");--> statement-breakpoint
CREATE INDEX "user_anime_progress_watched_idx" ON "user_anime_progress" USING btree ("user_id","watched");--> statement-breakpoint
CREATE INDEX "user_stream_history_episode_idx" ON "user_stream_history" USING btree ("anime_id","season","episode");--> statement-breakpoint
CREATE INDEX "user_stream_history_user_episode_idx" ON "user_stream_history" USING btree ("user_id","anime_id","season","episode","used_at" DESC NULLS LAST);