import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import type { Anime } from "@template/shared";

import { animeApi, eventsApi } from "../../lib/api";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useAuthStore } from "../../store/auth.store";
import { AnimeDetailEpisodeSection } from "./components/AnimeDetailEpisodeSection";
import { AnimeDetailErrorShell } from "./components/AnimeDetailErrorShell";
import { AnimeDetailHeader } from "./components/AnimeDetailHeader";
import { AnimeDetailSkeleton } from "./components/AnimeDetailSkeleton";

export type AnimeDetail = Anime & { hidden?: boolean; hiddenReason?: string | null };

export const AnimeDetailPage = () => {
  const { malId: malIdParam } = useParams<{ malId: string }>();
  const animeId = useMemo(() => Number.parseInt(malIdParam ?? "", 10), [malIdParam]);
  const token = useAuthStore((state) => state.token);
  const isAdmin = useAuthStore((state) => state.user?.isAdmin ?? false);
  const queryClient = useQueryClient();
  const [season, setSeason] = useState(1);
  const [manualEpisode, setManualEpisode] = useState(1);
  const [listMessage, setListMessage] = useState<string | null>(null);

  const animeQuery = useQuery<AnimeDetail>({
    queryKey: ["anime", animeId],
    queryFn: () => animeApi.detail(animeId) as Promise<AnimeDetail>,
    enabled: Number.isFinite(animeId),
  });
  const episodesQuery = useQuery({
    queryKey: ["anime-episodes", animeId],
    queryFn: () => animeApi.episodes(animeId),
    enabled: Number.isFinite(animeId),
  });
  const progressQuery = useQuery({
    queryKey: ["anime-progress", animeId],
    queryFn: () => animeApi.progress(animeId),
    enabled: Boolean(token) && Number.isFinite(animeId),
  });
  const listsQuery = useQuery({
    queryKey: ["anime-lists"],
    queryFn: () => animeApi.lists(),
    enabled: Boolean(token),
  });

  useDocumentTitle(animeQuery.data ? `${animeQuery.data.title} — Anistic` : "Detalle — Anistic");

  useEffect(() => {
    if (!animeQuery.data || !token) return;
    void eventsApi.track({ eventType: "anime_viewed", animeId: animeQuery.data.id }).catch(() => undefined);
  }, [animeQuery.data, token]);

  const saveList = useMutation({
    mutationFn: (status: "watching" | "completed" | "pending") => animeApi.saveList(animeId, status),
    onSuccess: async () => {
      setListMessage("Lista actualizada.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["anime-lists"] }),
        queryClient.invalidateQueries({ queryKey: ["discovery"] }),
      ]);
    },
    onError: (error) => setListMessage(error.message),
  });

  const removeList = useMutation({
    mutationFn: () => animeApi.removeList(animeId),
    onSuccess: async () => {
      setListMessage("Anime quitado de tus listas.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["anime-lists"] }),
        queryClient.invalidateQueries({ queryKey: ["discovery"] }),
      ]);
    },
    onError: (error) => setListMessage(error.message),
  });

  const toggleVisibility = useMutation({
    mutationFn: () => animeApi.setVisibility(animeId, { hidden: !(animeQuery.data?.hidden ?? false) }),
    onSuccess: async () => {
      toast.success("Visibilidad actualizada");
      await queryClient.invalidateQueries({ queryKey: ["anime", animeId] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (!Number.isFinite(animeId)) return <AnimeDetailErrorShell>Anime inválido.</AnimeDetailErrorShell>;
  if (animeQuery.isLoading) return <AnimeDetailSkeleton />;
  if (animeQuery.error || !animeQuery.data) return <AnimeDetailErrorShell>No pudimos cargar este anime.</AnimeDetailErrorShell>;

  const anime = animeQuery.data;
  const currentList = listsQuery.data?.find((item) => item.anime.id === anime.id)?.list.status;

  return (
    <main className="min-h-screen px-5 py-8 text-cream-primary">
      <section className="relative z-10 mx-auto max-w-6xl">
        <AnimeDetailHeader
          anime={anime}
          continueWatching={progressQuery.data?.continueWatching}
          token={token}
          currentList={currentList}
          listMessage={listMessage}
          isAdmin={isAdmin}
          hidden={anime.hidden ?? false}
          hiddenReason={anime.hiddenReason ?? null}
          onToggleVisibility={toggleVisibility.mutate}
          onSaveList={saveList.mutate}
          onRemoveList={removeList.mutate}
        />

        <AnimeDetailEpisodeSection
          anime={anime}
          episodes={episodesQuery.data ?? []}
          progress={progressQuery.data?.progress}
          season={season}
          onSeasonChange={setSeason}
          manualEpisode={manualEpisode}
          onManualEpisodeChange={setManualEpisode}
        />
      </section>
    </main>
  );
};
