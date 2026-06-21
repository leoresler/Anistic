# Migration Merge Notes

Phase 2 merged the root Drizzle schema with the nested donor database schema, but did not merge donor migration history.

Reason: root already has `0001_ai_recommendation_searches.sql`, while the donor has a different `0001_anime_catalogue.sql`. The donor journal also references migrations through `0005`, but the donor `meta` directory only contains `0000_snapshot.json`. Renumbering donor migrations or inventing snapshots would create risky migration history.

Current strategy:

- Keep root `drizzle/0000_supreme_red_skull.sql` and `drizzle/0001_ai_recommendation_searches.sql` unchanged.
- Keep root `drizzle/meta` unchanged.
- Update `src/schema.ts` only so future migration generation can produce a canonical root migration from the merged schema.

Follow-up: ✅ Resolved. Generated canonical root migration `0002_natural_warpath.sql` on 2026-06-19. It adds the 9 donor tables (`animes`, `anime_genres`, `anime_episodes`, `user_addons`, `user_anime_progress`, `user_anime_lists`, `user_stream_history`, `anime_user_events`, `addon_reports`), preserves the existing `users` (2 rows) and `ai_recommendation_searches` (4 rows), and brings the journal to 3 entries covering all 11 tables. `drizzle-kit generate` now reports "No schema changes, nothing to migrate".
