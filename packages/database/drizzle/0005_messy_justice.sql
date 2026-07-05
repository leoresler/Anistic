ALTER TABLE "animes" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN "country_of_origin" text;--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN "is_adult" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "animes" ADD COLUMN "hidden_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "animes_hidden_idx" ON "animes" USING btree ("hidden");