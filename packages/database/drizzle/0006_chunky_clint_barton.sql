ALTER TABLE "animes" ADD COLUMN "start_date" date;--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN "format" text;--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN "relevance_score" numeric(6, 2);--> statement-breakpoint
CREATE INDEX "animes_start_date_idx" ON "animes" USING btree ("start_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "animes_format_idx" ON "animes" USING btree ("format");--> statement-breakpoint
CREATE INDEX "animes_relevance_score_idx" ON "animes" USING btree ("relevance_score" DESC NULLS LAST);