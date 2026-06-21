import { desc, eq, ilike, sql } from "drizzle-orm";

import { aiRecommendationSearches, animes, createDb } from "@template/database";
import type { AiRecommendationsPayload } from "@template/shared";

import { env } from "../env";

const { db } = createDb(env.DATABASE_URL);

const HISTORY_LIMIT = 5;

/**
 * Fuzzy-match an AI recommendation title against the anime catalog.
 * Tries exact match first, then ILIKE, then tsvector full-text.
 */
export const matchRecommendationToAnime = async (title: string) => {
  const normalized = title.trim().toLowerCase();

  // 1. Exact match (case-insensitive)
  const exact = await db.select({
    id: animes.id,
    malId: animes.malId,
    title: animes.title,
    titleEnglish: animes.titleEnglish,
    imageUrl: animes.imageUrl,
    episodes: animes.episodes,
    score: animes.score,
    year: animes.year,
  }).from(animes).where(ilike(animes.title, normalized)).limit(1);

  if (exact.length > 0) return exact[0];

  // 2. Partial match (title contains search term)
  const partial = await db.select({
    id: animes.id,
    malId: animes.malId,
    title: animes.title,
    titleEnglish: animes.titleEnglish,
    imageUrl: animes.imageUrl,
    episodes: animes.episodes,
    score: animes.score,
    year: animes.year,
  }).from(animes).where(ilike(animes.title, `%${normalized}%`)).limit(1);

  if (partial.length > 0) return partial[0];

  return null;
};

/**
 * Match all recommendations against catalog and attach anime data.
 */
export const enrichRecommendationsWithAnime = async (
  recommendations: AiRecommendationsPayload["recommendations"],
) => {
  const enriched = await Promise.all(
    recommendations.map(async (rec) => {
      const anime = await matchRecommendationToAnime(rec.title);
      return { ...rec, anime: anime ?? null };
    }),
  );
  return enriched;
};

export const saveAiRecommendationSearch = async (
  input: { userId: string; query: string } & AiRecommendationsPayload,
) => {
  // Delete oldest entries beyond limit to keep only HISTORY_LIMIT
  const existing = await db.select({ id: aiRecommendationSearches.id }).from(aiRecommendationSearches).where(eq(aiRecommendationSearches.userId, input.userId)).orderBy(desc(aiRecommendationSearches.createdAt));

  if (existing.length >= HISTORY_LIMIT) {
    const idsToDelete = existing.slice(HISTORY_LIMIT - 1).map((row) => row.id);
    if (idsToDelete.length > 0) {
      await db.delete(aiRecommendationSearches).where(
        sql`${aiRecommendationSearches.id} IN (${sql.join(idsToDelete.map((id) => sql`${id}`), sql`,`)})`,
      );
    }
  }

  await db.insert(aiRecommendationSearches).values({
    userId: input.userId,
    query: input.query,
    interpretation: input.interpretation,
    recommendations: input.recommendations,
  });
};

export const getAiRecommendationHistory = async (userId: string) => {
  const rows = await db.query.aiRecommendationSearches.findMany({
    where: eq(aiRecommendationSearches.userId, userId),
    orderBy: desc(aiRecommendationSearches.createdAt),
    limit: HISTORY_LIMIT,
  });

  return rows.map(toHistoryItem);
};

const toHistoryItem = (row: typeof aiRecommendationSearches.$inferSelect) => ({
  id: row.id,
  query: row.query,
  interpretation: row.interpretation,
  recommendations: row.recommendations as AiRecommendationsPayload["recommendations"],
  created_at: row.createdAt.toISOString(),
});