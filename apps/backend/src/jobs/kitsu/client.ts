export type KitsuMappingClient = {
  findKitsuAnimeIdByMalId: (malId: number) => Promise<string | null>;
};

type KitsuMappingClientOptions = {
  endpoint?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

const getObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const getString = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);

const getAnimeIdFromResource = (value: unknown) => {
  const resource = getObject(value);
  if (!resource || resource.type !== "anime") return null;
  return getString(resource.id);
};

const getAnimeIdFromRelatedUrl = (value: unknown) => {
  const related = getString(value);
  const match = related?.match(/\/anime\/(\d+)(?:$|[/?#])/);
  return match?.[1] ?? null;
};

const getFirstMapping = (body: unknown) => {
  const root = getObject(body);
  const data = root?.data;
  if (Array.isArray(data)) return getObject(data[0]);
  return getObject(data);
};

export const extractKitsuAnimeIdFromMappingResponse = (body: unknown): string | null => {
  const root = getObject(body);
  const directAnimeId = getAnimeIdFromResource(root?.data);
  if (directAnimeId) return directAnimeId;

  const mapping = getFirstMapping(body);
  const item = getObject(getObject(mapping?.relationships)?.item);
  const relationshipAnimeId = getAnimeIdFromResource(item?.data);
  if (relationshipAnimeId) return relationshipAnimeId;

  const included = root?.included;
  if (Array.isArray(included)) {
    const relationshipId = getString(getObject(item?.data)?.id);
    const includedAnime = included.find((resource) => {
      const itemResource = getObject(resource);
      return itemResource?.type === "anime" && (!relationshipId || itemResource.id === relationshipId);
    });
    const includedAnimeId = getAnimeIdFromResource(includedAnime);
    if (includedAnimeId) return includedAnimeId;
  }

  return getAnimeIdFromRelatedUrl(getObject(item?.links)?.related);
};

const getRelatedItemUrl = (body: unknown) => {
  const mapping = getFirstMapping(body);
  const item = getObject(getObject(mapping?.relationships)?.item);
  return getString(getObject(item?.links)?.related);
};

const fetchJson = async (fetchImpl: typeof fetch, url: string, timeoutMs: number) => {
  const response = await fetchImpl(url, {
    headers: { accept: "application/vnd.api+json, application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`Kitsu HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
};

export const createKitsuMappingClient = ({ endpoint = "https://kitsu.io/api/edge", fetchImpl = fetch, timeoutMs = 10_000 }: KitsuMappingClientOptions = {}): KitsuMappingClient => ({
  findKitsuAnimeIdByMalId: async (malId) => {
    const url = new URL(`${endpoint}/mappings`);
    url.searchParams.set("filter[externalSite]", "myanimelist/anime");
    url.searchParams.set("filter[externalId]", String(malId));
    url.searchParams.set("include", "item");

    const body = await fetchJson(fetchImpl, url.toString(), timeoutMs);
    const kitsuId = extractKitsuAnimeIdFromMappingResponse(body);
    if (kitsuId) return kitsuId;

    const relatedUrl = getRelatedItemUrl(body);
    if (!relatedUrl) return null;

    return extractKitsuAnimeIdFromMappingResponse(await fetchJson(fetchImpl, relatedUrl, timeoutMs));
  },
});
