import { z } from "zod";

export const aiRecommendationsRequestSchema = z.object({
  query: z.string().trim().min(3, "La búsqueda debe tener al menos 3 caracteres").max(300, "La búsqueda no puede superar 300 caracteres"),
});

const animeSummarySchema = z.object({
  id: z.number(),
  malId: z.number(),
  title: z.string(),
  titleEnglish: z.string().nullable(),
  imageUrl: z.string().nullable(),
  episodes: z.number().nullable(),
  score: z.string().nullable(),
  year: z.number().nullable(),
});

export const aiRecommendationSchema = z.object({
  title: z.string(),
  year: z.number().int().nullable(),
  genres: z.array(z.string()),
  episodes: z.number().int().nullable(),
  reason: z.string(),
  similarity_score: z.number().min(0).max(1),
  anime: animeSummarySchema.nullable().optional(),
});

export const aiRecommendationsPayloadSchema = z.object({
  interpretation: z.string().nullable(),
  recommendations: z.array(aiRecommendationSchema),
});

export type AiRecommendationsRequest = z.infer<typeof aiRecommendationsRequestSchema>;
export type AiRecommendation = z.infer<typeof aiRecommendationSchema>;
export type AiRecommendationsPayload = z.infer<typeof aiRecommendationsPayloadSchema>;
export type AnimeSummaryAi = z.infer<typeof animeSummarySchema>;

export type AiRecommendationHistoryItem = {
  id: string;
  query: string;
  interpretation: string | null;
  recommendations: AiRecommendation[];
  created_at: string;
};

export type AiRecommendationHistoryResponse = {
  items: AiRecommendationHistoryItem[];
};
