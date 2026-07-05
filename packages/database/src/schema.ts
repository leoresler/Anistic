import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

type AiRecommendationJson = {
  title: string;
  year: number | null;
  genres: string[];
  episodes: number | null;
  reason: string;
  similarity_score: number;
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email"),
    phone: text("phone"),
    password: text("password"),
    googleId: text("google_id"),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    isAdmin: boolean("is_admin").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_unique_idx").on(table.email),
    uniqueIndex("users_phone_unique_idx").on(table.phone),
    uniqueIndex("users_google_id_unique_idx").on(table.googleId),
    index("users_created_at_idx").on(table.createdAt),
  ],
);

export const aiRecommendationSearches = pgTable(
  "ai_recommendation_searches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    query: text("query").notNull(),
    interpretation: text("interpretation"),
    recommendations: jsonb("recommendations").$type<AiRecommendationJson[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("ai_recommendation_searches_user_created_at_idx").on(table.userId, table.createdAt)],
);

export const animes = pgTable(
  "animes",
  {
    id: integer("id").primaryKey(),
    title: text("title").notNull(),
    titleEnglish: text("title_english"),
    titleJapanese: text("title_japanese"),
    synopsis: text("synopsis"),
    imageUrl: text("image_url"),
    trailerUrl: text("trailer_url"),
    episodes: integer("episodes"),
    status: text("status"),
    score: numeric("score", { precision: 4, scale: 2 }),
    scoredBy: integer("scored_by"),
    rank: integer("rank"),
    popularity: integer("popularity"),
    year: integer("year"),
    season: text("season"),
    studio: text("studio"),
    rating: text("rating"),
    duration: text("duration"),
    source: text("source"),
    malId: integer("mal_id").notNull(),
    kitsuId: text("kitsu_id"),
    imdbId: text("imdb_id"),
    anilistId: integer("anilist_id"),
    bannerUrl: text("banner_url"),
    anilistPopularity: integer("anilist_popularity"),
    hidden: boolean("hidden").default(false).notNull(),
    countryOfOrigin: text("country_of_origin"),
    isAdult: boolean("is_adult").default(false).notNull(),
    hiddenReason: text("hidden_reason"),
    startDate: date("start_date", { mode: "date" }),
    format: text("format"),
    relevanceScore: numeric("relevance_score", { precision: 6, scale: 2 }),
    syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("animes_mal_id_unique_idx").on(table.malId),
    uniqueIndex("animes_anilist_id_unique_idx").on(table.anilistId),
    index("animes_anilist_popularity_idx").on(table.anilistPopularity.desc()),
    index("animes_score_idx").on(table.score.desc()),
    index("animes_popularity_idx").on(table.popularity.asc()),
    index("animes_year_idx").on(table.year.desc()),
    index("animes_status_idx").on(table.status),
    index("animes_hidden_idx").on(table.hidden),
    index("animes_search_idx").using(
      "gin",
      sql`to_tsvector('spanish', coalesce(${table.title}, '') || ' ' || coalesce(${table.synopsis}, ''))`,
    ),
    index("animes_start_date_idx").on(table.startDate.desc()),
    index("animes_format_idx").on(table.format),
    index("animes_relevance_score_idx").on(table.relevanceScore.desc()),
  ],
);

export const animeGenres = pgTable(
  "anime_genres",
  {
    animeId: integer("anime_id")
      .notNull()
      .references(() => animes.id, { onDelete: "cascade" }),
    genre: text("genre").notNull(),
  },
  (table) => [primaryKey({ columns: [table.animeId, table.genre] })],
);

export const userAddons = pgTable(
  "user_addons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    manifest: jsonb("manifest"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("user_addons_user_created_at_idx").on(table.userId, table.createdAt.desc())],
);

export const userAnimeProgress = pgTable(
  "user_anime_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    animeId: integer("anime_id")
      .notNull()
      .references(() => animes.id, { onDelete: "cascade" }),
    season: integer("season").notNull().default(1),
    episode: integer("episode").notNull(),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    progressSeconds: integer("progress_seconds").notNull().default(0),
    watched: boolean("watched").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_anime_progress_unique_episode_idx").on(table.userId, table.animeId, table.season, table.episode),
    index("user_anime_progress_continue_idx").on(table.userId, table.updatedAt.desc()),
    index("user_anime_progress_user_anime_idx").on(table.userId, table.animeId),
    index("user_anime_progress_watched_idx").on(table.userId, table.watched),
  ],
);

export const userAnimeLists = pgTable(
  "user_anime_lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    animeId: integer("anime_id")
      .notNull()
      .references(() => animes.id, { onDelete: "cascade" }),
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_anime_lists_unique_anime_idx").on(table.userId, table.animeId),
    index("user_anime_lists_user_status_idx").on(table.userId, table.status, table.updatedAt.desc()),
  ],
);

export const animeEpisodes = pgTable(
  "anime_episodes",
  {
    animeId: integer("anime_id")
      .notNull()
      .references(() => animes.id, { onDelete: "cascade" }),
    season: integer("season").notNull().default(1),
    episode: integer("episode").notNull(),
    title: text("title"),
    thumbnailUrl: text("thumbnail_url"),
    airedAt: timestamp("aired_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.animeId, table.season, table.episode] }),
    index("anime_episodes_air_date_idx").on(table.airedAt.desc()),
  ],
);

export const animeEpisodesCache = pgTable(
  "anime_episodes_cache",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    animeId: integer("anime_id")
      .notNull()
      .references(() => animes.id, { onDelete: "cascade" }),
    page: integer("page").notNull(),
    data: jsonb("data").notNull(),
    cachedAt: timestamp("cached_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("anime_episodes_cache_anime_page_unique_idx").on(table.animeId, table.page),
    index("anime_episodes_cache_anime_idx").on(table.animeId),
  ],
);

export const userStreamHistory = pgTable(
  "user_stream_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    animeId: integer("anime_id")
      .notNull()
      .references(() => animes.id, { onDelete: "cascade" }),
    season: integer("season").notNull().default(1),
    episode: integer("episode").notNull(),
    addonName: text("addon_name").notNull(),
    streamTitle: text("stream_title").notNull(),
    streamUrl: text("stream_url").notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("user_stream_history_episode_idx").on(table.animeId, table.season, table.episode),
    index("user_stream_history_user_episode_idx").on(table.userId, table.animeId, table.season, table.episode, table.usedAt.desc()),
  ],
);

export const animeUserEvents = pgTable(
  "anime_user_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    animeId: integer("anime_id").references(() => animes.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    season: integer("season"),
    episode: integer("episode"),
    query: text("query"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("anime_user_events_user_created_at_idx").on(table.userId, table.createdAt.desc()),
    index("anime_user_events_anime_created_at_idx").on(table.animeId, table.createdAt.desc()),
    index("anime_user_events_type_created_at_idx").on(table.eventType, table.createdAt.desc()),
    index("anime_user_events_created_at_idx").on(table.createdAt.desc()),
  ],
);

export const addonReports = pgTable(
  "addon_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addonId: uuid("addon_id").references(() => userAddons.id, { onDelete: "set null" }),
    addonUrl: text("addon_url").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("addon_reports_addon_idx").on(table.addonId, table.createdAt.desc())],
);

export const animesRelations = relations(animes, ({ many }) => ({
  genres: many(animeGenres),
  progress: many(userAnimeProgress),
  lists: many(userAnimeLists),
  canonicalEpisodes: many(animeEpisodes),
  episodesCache: many(animeEpisodesCache),
  streamHistory: many(userStreamHistory),
  userEvents: many(animeUserEvents),
}));

export const animeEpisodesRelations = relations(animeEpisodes, ({ one }) => ({
  anime: one(animes, {
    fields: [animeEpisodes.animeId],
    references: [animes.id],
  }),
}));

export const animeEpisodesCacheRelations = relations(animeEpisodesCache, ({ one }) => ({
  anime: one(animes, {
    fields: [animeEpisodesCache.animeId],
    references: [animes.id],
  }),
}));

export const animeGenresRelations = relations(animeGenres, ({ one }) => ({
  anime: one(animes, {
    fields: [animeGenres.animeId],
    references: [animes.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  recommendationSearches: many(aiRecommendationSearches),
  addons: many(userAddons),
  animeProgress: many(userAnimeProgress),
  animeLists: many(userAnimeLists),
  streamHistory: many(userStreamHistory),
  animeEvents: many(animeUserEvents),
  addonReports: many(addonReports),
}));

export const aiRecommendationSearchesRelations = relations(aiRecommendationSearches, ({ one }) => ({
  user: one(users, {
    fields: [aiRecommendationSearches.userId],
    references: [users.id],
  }),
}));

export const userAddonsRelations = relations(userAddons, ({ one }) => ({
  user: one(users, {
    fields: [userAddons.userId],
    references: [users.id],
  }),
}));

export const userAnimeProgressRelations = relations(userAnimeProgress, ({ one }) => ({
  user: one(users, {
    fields: [userAnimeProgress.userId],
    references: [users.id],
  }),
  anime: one(animes, {
    fields: [userAnimeProgress.animeId],
    references: [animes.id],
  }),
}));

export const userAnimeListsRelations = relations(userAnimeLists, ({ one }) => ({
  user: one(users, {
    fields: [userAnimeLists.userId],
    references: [users.id],
  }),
  anime: one(animes, {
    fields: [userAnimeLists.animeId],
    references: [animes.id],
  }),
}));



export const userStreamHistoryRelations = relations(userStreamHistory, ({ one }) => ({
  user: one(users, {
    fields: [userStreamHistory.userId],
    references: [users.id],
  }),
  anime: one(animes, {
    fields: [userStreamHistory.animeId],
    references: [animes.id],
  }),
}));

export const animeUserEventsRelations = relations(animeUserEvents, ({ one }) => ({
  user: one(users, {
    fields: [animeUserEvents.userId],
    references: [users.id],
  }),
  anime: one(animes, {
    fields: [animeUserEvents.animeId],
    references: [animes.id],
  }),
}));

export const addonReportsRelations = relations(addonReports, ({ one }) => ({
  user: one(users, {
    fields: [addonReports.userId],
    references: [users.id],
  }),
  addon: one(userAddons, {
    fields: [addonReports.addonId],
    references: [userAddons.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AiRecommendationSearch = typeof aiRecommendationSearches.$inferSelect;
export type NewAiRecommendationSearch = typeof aiRecommendationSearches.$inferInsert;
export type Anime = typeof animes.$inferSelect;
export type NewAnime = typeof animes.$inferInsert;
export type AnimeGenre = typeof animeGenres.$inferSelect;
export type UserAddon = typeof userAddons.$inferSelect;
export type NewUserAddon = typeof userAddons.$inferInsert;
export type UserAnimeProgress = typeof userAnimeProgress.$inferSelect;
export type NewUserAnimeProgress = typeof userAnimeProgress.$inferInsert;
export type UserAnimeList = typeof userAnimeLists.$inferSelect;
export type AnimeEpisode = typeof animeEpisodes.$inferSelect;
export type AnimeEpisodesCache = typeof animeEpisodesCache.$inferSelect;
export type NewAnimeEpisodesCache = typeof animeEpisodesCache.$inferInsert;
export type UserStreamHistory = typeof userStreamHistory.$inferSelect;
export type AnimeUserEvent = typeof animeUserEvents.$inferSelect;
export type NewAnimeUserEvent = typeof animeUserEvents.$inferInsert;
export type AddonReport = typeof addonReports.$inferSelect;
