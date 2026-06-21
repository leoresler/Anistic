import { animeUserEvents, createDb } from "@template/database";
import { userEventTypes, type RecordUserEventInput, type UserEventType } from "@template/shared";

import { env } from "../env";

const { db } = createDb(env.DATABASE_URL);

export { userEventTypes, type UserEventType };

export const isUserEventType = (value: string): value is UserEventType => userEventTypes.includes(value as UserEventType);

export const recordUserEvent = async ({ userId, eventType, animeId, season, episode, query, metadata }: RecordUserEventInput) => {
  await db.insert(animeUserEvents).values({
    userId,
    eventType,
    animeId: animeId ?? null,
    season: season ?? null,
    episode: episode ?? null,
    query: query?.trim() || null,
    metadata: metadata ?? null,
  });
};
