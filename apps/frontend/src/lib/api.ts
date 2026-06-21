import type {
  AddonReportBody,
  Anime,
  AnimeEpisode,
  AnimeListResponse,
  AnimeProgress,
  AnimeProgressBody,
  AnimeProgressResponse,
  AnimeStats,
  AuthResponse,
  ContinueWatchingItem,
  CurrentUserResponse,
  DiscoveryResponse,
  EmailAuthInput,
  GoogleAuthInput,
  OkResponse,
  PhoneAuthInput,
  RecommendedAddonsResponse,
  StreamsResponse,
  StreamUsedBody,
  StreamUsedResponse,
  UserAddon,
  UserAnimeList,
  UserAnimeListStatus,
  UserEventPayload,
  UserAnimeListBody,
  AiRecommendationHistoryResponse,
} from "@template/shared";

import { useAuthStore } from "../store/auth.store";

export type {
  Anime,
  AnimeProgress,
  AnimeSummary,
  ContinueWatchingItem,
  DiscoveryResponse,
  RecommendationItem,
  Stream,
  UserAnimeList,
  UserAnimeListStatus,
  UserAddon,
} from "@template/shared";

export const API_URL =
  import.meta.env?.VITE_API_URL?.trim() ||
  (typeof process !== "undefined" && process.env?.VITE_API_URL?.trim()) ||
  "http://localhost:3333";

type ApiErrorBody = {
  message?: string;
};

const readJsonBody = async <TResponse>(response: Response): Promise<TResponse | null> => {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as TResponse;
  } catch {
    throw new Error(
      response.ok
        ? "El servidor devolvió una respuesta invalida"
        : text,
    );
  }
};

const getErrorMessage = (body: ApiErrorBody | null, fallback: string) =>
  body?.message ?? fallback;

const post = async <TResponse, TPayload>(path: string, payload: TPayload): Promise<TResponse> => {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await readJsonBody<TResponse & ApiErrorBody>(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(body, `Request failed (${response.status})`));
  }

  if (!body) {
    throw new Error("El servidor no devolvió datos de autenticación");
  }

  return body as TResponse;
};

const getAuthenticated = async <TResponse>(path: string, token: string): Promise<TResponse> => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const body = await readJsonBody<TResponse & ApiErrorBody>(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(body, `Request failed (${response.status})`));
  }

  if (!body) {
    throw new Error("El servidor no devolvió datos de sesión");
  }

  return body as TResponse;
};

const get = async <TResponse>(path: string): Promise<TResponse> => {
  const response = await fetch(`${API_URL}${path}`);
  const body = await readJsonBody<TResponse & ApiErrorBody>(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(body, `Request failed (${response.status})`));
  }

  if (!body) {
    throw new Error("El servidor no devolvió datos");
  }

  return body as TResponse;
};

const authFetch = async <TResponse>(path: string, init?: RequestInit): Promise<TResponse> => {
  const token = useAuthStore.getState().token;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  const body = await readJsonBody<TResponse & ApiErrorBody>(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(body, `Request failed (${response.status})`));
  }

  if (!body) {
    throw new Error("El servidor no devolvió datos");
  }

  return body as TResponse;
};

export const authApi = {
  registerEmail: (payload: EmailAuthInput) =>
    post<AuthResponse, EmailAuthInput>("/api/auth/register-email", payload),
  loginEmail: (payload: EmailAuthInput) => post<AuthResponse, EmailAuthInput>("/api/auth/login-email", payload),
  registerPhone: (payload: PhoneAuthInput) =>
    post<AuthResponse, PhoneAuthInput>("/api/auth/register-phone", payload),
  loginPhone: (payload: PhoneAuthInput) => post<AuthResponse, PhoneAuthInput>("/api/auth/login-phone", payload),
  loginGoogle: (payload: GoogleAuthInput) => post<AuthResponse, GoogleAuthInput>("/api/auth/google", payload),
  currentUser: (token: string) => getAuthenticated<CurrentUserResponse>("/api/auth/me", token),
};

export const aiApi = {
  history: (token: string) => getAuthenticated<AiRecommendationHistoryResponse>("/api/ai/recommendations/history", token),
};

export const animeApi = {
  list: (searchParams: URLSearchParams) => get<AnimeListResponse>(`/api/animes?${searchParams.toString()}`),
  detail: (id: number) => get<Anime>(`/api/animes/${id}`),
  genres: () => get<{ genres: string[] }>("/api/animes/genres"),
  stats: () => get<AnimeStats>("/api/animes/stats"),
  discovery: () => authFetch<DiscoveryResponse>("/api/discovery"),
  episodes: (id: number) => get<AnimeEpisode[]>(`/api/animes/${id}/episodes`),
  progress: (id: number) => authFetch<AnimeProgressResponse>(`/api/animes/${id}/progress`),
  saveProgress: (id: number, payload: AnimeProgressBody) =>
    authFetch<AnimeProgress>(`/api/animes/${id}/progress`, { method: "PUT", body: JSON.stringify(payload) }),
  continueWatching: () => authFetch<ContinueWatchingItem[]>("/api/me/continue-watching"),
  lists: (status?: UserAnimeListStatus) => authFetch<UserAnimeList[]>(`/api/me/lists${status ? `?status=${status}` : ""}`),
  saveList: (id: number, status: UserAnimeListBody["status"]) =>
    authFetch<UserAnimeList["list"]>(`/api/animes/${id}/list`, { method: "PUT", body: JSON.stringify({ status }) }),
  removeList: (id: number) => authFetch<OkResponse>(`/api/animes/${id}/list`, { method: "DELETE" }),
};

export const eventsApi = {
  track: (payload: UserEventPayload) => authFetch<OkResponse>("/api/events", { method: "POST", body: JSON.stringify(payload) }),
};

export const addonApi = {
  list: () => authFetch<UserAddon[]>("/api/addons"),
  create: (url: string) => authFetch<UserAddon>("/api/addons", { method: "POST", body: JSON.stringify({ url }) }),
  remove: (id: string) => authFetch<OkResponse>(`/api/addons/${id}`, { method: "DELETE" }),
  streams: (params: { malId: number; season: number; episode: number }) => {
    const search = new URLSearchParams({
      mal_id: String(params.malId),
      season: String(params.season),
      episode: String(params.episode),
    });
    return authFetch<StreamsResponse>(`/api/addons/streams?${search.toString()}`);
  },
  markUsed: (payload: StreamUsedBody) =>
    authFetch<StreamUsedResponse>("/api/addons/streams/used", { method: "POST", body: JSON.stringify(payload) }),
  report: (id: string, reason: AddonReportBody["reason"]) =>
    authFetch<OkResponse>(`/api/addons/${id}/report`, { method: "POST", body: JSON.stringify({ reason }) }),
  recommended: () => authFetch<RecommendedAddonsResponse>("/api/addons/recommended"),
};
