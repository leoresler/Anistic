import { z } from "zod";

export const userEventTypes = [
  "anime_viewed",
  "episode_started",
  "episode_completed",
  "list_added",
  "stream_used",
  "search_performed",
  "card_clicked",
] as const;

export const userEventTypeSchema = z.enum(userEventTypes);

export const userEventPayloadSchema = z.object({
  eventType: userEventTypeSchema,
  animeId: z.coerce.number().int().positive().optional(),
  season: z.coerce.number().int().positive().optional(),
  episode: z.coerce.number().int().positive().optional(),
  query: z.string().trim().min(1).max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UserEventType = z.infer<typeof userEventTypeSchema>;
export type UserEventPayload = z.infer<typeof userEventPayloadSchema>;

export type RecordUserEventInput = Omit<UserEventPayload, "animeId" | "season" | "episode" | "query" | "metadata"> & {
  userId: string;
  animeId?: number | null;
  season?: number | null;
  episode?: number | null;
  query?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type OkResponse = {
  ok: boolean;
};
