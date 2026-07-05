import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { CarouselRow } from "../../components/ui/CarouselRow";
import { EmptyState } from "../../components/ui/EmptyState";
import { animeApi } from "../../lib/api";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { AnimePosterCard } from "./components/AnimePosterCard";
import { ContinueWatchingCard } from "./components/ContinueWatchingCard";
import { InicioGreeting } from "./components/InicioGreeting";
import { InicioSidebar } from "./components/InicioSidebar";
import { InicioSkeleton } from "./components/InicioSkeleton";

export const InicioPage = () => {
  useDocumentTitle("Inicio — Anistic");
  const discoveryQuery = useQuery({ queryKey: ["discovery"], queryFn: animeApi.discovery });
  const data = discoveryQuery.data;

  const hasWatchHistory =
    data ?
      data.continueWatching.length > 0 ||
      data.becauseYouWatched.sourceGenres.length > 0 ||
      data.becauseYouWatched.sourceStudios.length > 0
    : false;

  const recommendationTitle = hasWatchHistory
    ? `Porque viste ${data!.becauseYouWatched.sourceGenres.slice(0, 2).join(" y ") || "lo que te gusta"}`
    : "Populares ahora";

  const recommendationSubtitle = hasWatchHistory
    ? "Recomendaciones basadas en tu historial."
    : "Lo que más se está viendo esta semana.";

  const recommendationItems = hasWatchHistory ? data!.becauseYouWatched.items : data?.topWeek.items ?? [];

  const hasAnyContent =
    data &&
    (data.continueWatching.length > 0 ||
      recommendationItems.length > 0 ||
      data.newEpisodes.length > 0 ||
      data.topWeek.items.length > 0 ||
      data.popularAmongUsers.length > 0);

  return (
    <main className="min-h-screen px-5 py-8 text-cream-primary">
      <section className="relative z-10 mx-auto max-w-[1600px]">
        <InicioGreeting />

        <div className="mt-6">
          <InicioSidebar lists={data?.lists} />
        </div>

        <div className="mt-8 min-w-0 space-y-12">
          {discoveryQuery.isLoading ? (
            <InicioSkeleton />
          ) : discoveryQuery.isError ? (
            <EmptyState
              title="No pudimos cargar el inicio"
              description="Ocurrió un error al obtener tus recomendaciones. Probá de nuevo en unos segundos."
              action={
                <button
                  type="button"
                  onClick={() => discoveryQuery.refetch()}
                  className="rounded-full bg-sabio px-6 py-3 font-black text-anime-main transition hover:bg-sabio-light"
                >
                  Reintentar
                </button>
              }
            />
          ) : !hasAnyContent ? (
            <EmptyState
              title="Todavía no hay contenido"
              description="A medida que uses Anistic, acá van a aparecer recomendaciones, estrenos y más."
              action={
                <Link
                  to="/explorar"
                  className="rounded-full bg-sabio px-6 py-3 font-black text-anime-main transition hover:bg-sabio-light"
                >
                  Explorar animes
                </Link>
              }
            />
          ) : (
            <>
              {data.continueWatching.length ? (
                <CarouselRow title="Continuar viendo" linkTo="/explorar">
                  {data.continueWatching.map((item) => (
                    <ContinueWatchingCard key={item.progress.id} item={item} />
                  ))}
                </CarouselRow>
              ) : null}

              {recommendationItems.length ? (
                <CarouselRow title={recommendationTitle} subtitle={recommendationSubtitle} linkTo="/explorar">
                  {recommendationItems.map((item) => (
                    <AnimePosterCard key={item.anime.id} anime={item.anime} />
                  ))}
                </CarouselRow>
              ) : null}

              {data.newEpisodes.length ? (
                <CarouselRow
                  title="Estrenos de la temporada"
                  subtitle="Estrenos reales de los últimos 30 días"
                  linkTo="/explorar"
                >
                  {data.newEpisodes.map(({ anime }) => (
                    <AnimePosterCard key={anime.id} anime={anime} />
                  ))}
                </CarouselRow>
              ) : null}

              {data.topWeek.items.length ? (
                <CarouselRow
                  title="Top semanal"
                  subtitle={
                    data.topWeek.source === "trending"
                      ? "Top semanal — según AniList"
                      : data.topWeek.fallback
                        ? "Aún estamos juntando actividad; por ahora usamos ranking y popularidad."
                        : "Basado en actividad real de los últimos 7 días."
                  }
                  linkTo="/explorar"
                >
                  {data.topWeek.items.map((item) => (
                    <AnimePosterCard key={item.anime.id} anime={item.anime} />
                  ))}
                </CarouselRow>
              ) : null}

              {data.popularAmongUsers.length ? (
                <CarouselRow title="Popular en la comunidad" subtitle="Basado en actividad global de usuarios." linkTo="/explorar">
                  {data.popularAmongUsers.map((item) => (
                    <AnimePosterCard key={item.anime.id} anime={item.anime} />
                  ))}
                </CarouselRow>
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
};