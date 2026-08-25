import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { animeApi, eventsApi } from "../../lib/api";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useAuthStore } from "../../store/auth.store";
import { AnimeDetailEpisodeSection } from "./components/AnimeDetailEpisodeSection";
import { AnimeDetailErrorShell } from "./components/AnimeDetailErrorShell";
import { AnimeDetailHeader } from "./components/AnimeDetailHeader";

export const AnimeDetailPage = () => {
  const { malId: malIdParam } = useParams<{ malId: string }>();
  const animeId = useMemo(() => Number.parseInt(malIdParam ?? "", 10), [malIdParam]);
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [season, setSeason] = useState(1);
  const [manualEpisode, setManualEpisode] = useState(1);
  const [listMessage, setListMessage] = useState<string | null>(null);

  const animeQuery = useQuery({
    queryKey: ["anime", animeId],
    queryFn: () => animeApi.detail(animeId),
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

  useEffect(() => {
    setSeason(1);
    setManualEpisode(1);
    setListMessage(null);
  }, [animeId]);

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

  if (!Number.isFinite(animeId)) return <AnimeDetailErrorShell>Anime inválido.</AnimeDetailErrorShell>;
  if (animeQuery.isLoading) return <AnimeDetailErrorShell>Cargando anime...</AnimeDetailErrorShell>;
  if (animeQuery.error || !animeQuery.data) return <AnimeDetailErrorShell>No pudimos cargar este anime.</AnimeDetailErrorShell>;

  const anime = animeQuery.data;
  const currentList = listsQuery.data?.find((item) => item.anime.id === anime.id)?.list.status;

  return (
    <main className="h-dvh overflow-hidden text-cream-primary">
      <section className="relative z-10 grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(380px,500px)]">
        <div className="h-full min-h-0 overflow-hidden">
          <AnimeDetailHeader
            anime={anime}
            continueWatching={progressQuery.data?.continueWatching}
            token={token}
            currentList={currentList}
            listMessage={listMessage}
            onSaveList={saveList.mutate}
            onRemoveList={removeList.mutate}
          />
        </div>

        <aside className="h-full min-h-0 overflow-hidden border-t border-white/10 bg-anime-main lg:border-l lg:border-t-0">
          <AnimeDetailEpisodeSection
            anime={anime}
            episodes={episodesQuery.data ?? []}
            progress={progressQuery.data?.progress}
            continueWatching={progressQuery.data?.continueWatching}
            season={season}
            onSeasonChange={setSeason}
            manualEpisode={manualEpisode}
            onManualEpisodeChange={setManualEpisode}
          />
        </aside>
      </section>
    </main>
  );
};
