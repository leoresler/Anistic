const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export type RelevanceInput = {
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  favourites: number | null;
  seasonYear: number | null;
  status: string | null;
};

export const computeRelevanceScore = (input: RelevanceInput, currentYear = new Date().getFullYear()) => {
  const popularity = input.popularity ?? 0;
  const favourites = input.favourites ?? 0;
  const scorePart = input.averageScore ?? input.meanScore ?? 0;
  const popPart = Math.min(Math.log10(popularity + 1) / 6, 1) * 100;
  const favPart = Math.min(Math.log10(favourites + 1) / 5, 1) * 30;
  const freshness = input.seasonYear ? clamp(10 - Math.abs(currentYear - input.seasonYear), 0, 10) : 0;

  const base = 0.55 * scorePart + 0.3 * popPart + favPart + freshness;
  const value = input.status === "NOT_YET_RELEASED" && scorePart === 0 ? Math.min(base, popPart + favPart + 10) : base;

  return Math.round(value * 100) / 100;
};
