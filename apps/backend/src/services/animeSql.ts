import { animes, animeGenres } from "@template/database";
import { sql } from "drizzle-orm";

export const buildAnimeCardSql = (options?: { includeHidden?: boolean }) => sql`
  json_build_object(
    'id', ${animes.id},
    'title', ${animes.title},
    'titleEnglish', ${animes.titleEnglish},
    'titleJapanese', ${animes.titleJapanese},
    'synopsis', ${animes.synopsis},
    'imageUrl', ${animes.imageUrl},
    'trailerUrl', ${animes.trailerUrl},
    'episodes', ${animes.episodes},
    'status', ${animes.status},
    'score', ${animes.score},
    'scoredBy', ${animes.scoredBy},
    'rank', ${animes.rank},
    'popularity', ${animes.popularity},
    'year', ${animes.year},
    'season', ${animes.season},
    'studio', ${animes.studio},
    'rating', ${animes.rating},
    'duration', ${animes.duration},
    'source', ${animes.source},
    'malId', ${animes.malId},
    'syncedAt', ${animes.syncedAt},
    'createdAt', ${animes.createdAt},
    'countryOfOrigin', ${animes.countryOfOrigin},
    'isAdult', ${animes.isAdult},
    'format', ${animes.format},
    'relevanceScore', ${animes.relevanceScore},
    'startDate', ${animes.startDate},
    ${options?.includeHidden ? sql`'hidden', ${animes.hidden}, 'hiddenReason', ${animes.hiddenReason},` : sql``}
    'genres', coalesce((select array_agg(${animeGenres.genre} order by ${animeGenres.genre}) from ${animeGenres} where ${animeGenres.animeId} = ${animes.id}), '{}')
  )
`;
