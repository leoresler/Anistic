export const aniListCountries = ["JP", "KR", "CN"] as const;
export const aniListFormats = ["TV", "MOVIE", "ONA", "OVA", "SPECIAL"] as const;
export const aniListBlockedGenres = ["Hentai", "Erotica", "Boys Love", "Girls Love", "Kids", "Music", "Avant Garde"] as const;
export const aniListBlockedTags = ["Hentai", "Erotica", "Boys Love", "Girls Love", "Kids", "Music", "Avant Garde", "Sexual Content", "Nudity"] as const;

export type AniListCountry = (typeof aniListCountries)[number];
export type AniListFormat = (typeof aniListFormats)[number];
export type AniListLane = { countryOfOrigin: AniListCountry; format: AniListFormat };

export const catalogLanes: AniListLane[] = aniListCountries.flatMap((countryOfOrigin) =>
  aniListFormats.map((format) => ({ countryOfOrigin, format })),
);

export const buildLaneVariables = (lane: AniListLane, page: number) => ({
  page,
  perPage: 50,
  countryOfOrigin: lane.countryOfOrigin,
  format: lane.format,
  blockedGenres: [...aniListBlockedGenres],
  blockedTags: [...aniListBlockedTags],
});

export const ANILIST_CATALOG_QUERY = /* GraphQL */ `
  query CatalogLane($page: Int!, $perPage: Int!, $countryOfOrigin: CountryCode, $format: MediaFormat, $blockedGenres: [String], $blockedTags: [String]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(type: ANIME, isAdult: false, countryOfOrigin: $countryOfOrigin, format: $format, genre_not_in: $blockedGenres, tag_not_in: $blockedTags, sort: [POPULARITY_DESC, SCORE_DESC]) {
        id
        idMal
        title { romaji english native }
        description
        coverImage { extraLarge large }
        bannerImage
        episodes
        status
        averageScore
        meanScore
        popularity
        favourites
        trending
        season
        seasonYear
        format
        countryOfOrigin
        source
        genres
        studios(isMain: true) { nodes { name } }
        externalLinks { site url }
        startDate { year month day }
      }
    }
  }
`;
