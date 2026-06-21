import { Heart, Loader2, RefreshCw, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";

import { feedbackLabels, type DisplayRecommendation, type Feedback } from "../types";
import { AiConfidenceBar } from "./AiConfidenceBar";

type AiRecommendationCardProps = {
  recommendation: DisplayRecommendation;
  index: number;
  liked: boolean;
  feedback?: Feedback;
  feedbackOpen: boolean;
  replacing: boolean;
  onToggleLike: () => void;
  onFeedback: (feedback: Feedback) => void;
  onOpenFeedback: () => void;
  onMoreLikeThis: () => void;
  onReplace: () => void;
};

export const AiRecommendationCard = ({
  recommendation,
  index,
  liked,
  feedback,
  feedbackOpen,
  replacing,
  onToggleLike,
  onFeedback,
  onOpenFeedback,
  onMoreLikeThis,
  onReplace,
}: AiRecommendationCardProps) => {
  const hasAnime = recommendation.anime != null;

  return (
    <article
      className="ai-card-enter flex min-h-72 flex-col rounded-2xl border border-anime-border bg-anime-surface transition hover:border-sabio-dim"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {hasAnime ? (
        <Link
          to={`/anime/${recommendation.anime!.malId}`}
          className="relative overflow-hidden rounded-t-2xl"
        >
          {recommendation.anime!.imageUrl ? (
            <img
              src={recommendation.anime!.imageUrl}
              alt={recommendation.title}
              className="aspect-3/2 w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex aspect-3/2 items-center justify-center bg-sabio-dim/30 text-xl font-black text-cream-primary">
              {recommendation.title.slice(0, 2)}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-anime-main via-anime-main/60 to-transparent p-3 pt-8">
            <h3 className="line-clamp-2 text-sm font-black leading-tight text-cream-primary">{recommendation.title}</h3>
            <p className="mt-1 text-[11px] font-bold text-cream-secondary">
              {recommendation.year ?? "Sin año"} · {recommendation.episodes ?? "?"} eps
            </p>
          </div>
          {recommendation.replaced ? (
            <span className="absolute left-2 top-2 rounded-full bg-sabio px-2 py-1 text-[10px] font-black text-anime-main">
              Nuevo
            </span>
          ) : null}
        </Link>
      ) : (
        <div className="rounded-t-2xl border-b border-anime-border bg-anime-input/50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-black leading-tight tracking-[-0.03em] text-cream-primary">
                {recommendation.title}
              </h3>
              <p className="mt-1 text-[11px] font-bold text-cream-secondary">
                {recommendation.year ?? "Sin año"} · {recommendation.episodes ?? "?"} eps
              </p>
            </div>
            {recommendation.replaced ? (
              <span className="shrink-0 rounded-full bg-sabio/15 px-2 py-1 text-[10px] font-black text-sabio-light">Nuevo</span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {recommendation.genres.slice(0, 4).map((genre) => (
              <span key={genre} className="rounded-full border border-anime-border/60 px-1.5 py-px text-[10px] font-bold text-cream-secondary">
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <p className="line-clamp-3 text-sm font-semibold leading-6 text-cream-secondary">{recommendation.reason}</p>
        <div className="mt-auto pt-3">
          <AiConfidenceBar score={recommendation.similarity_score} />
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-anime-border pt-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleLike}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
                  liked ? "bg-sabio text-anime-main" : "bg-anime-input text-cream-secondary hover:text-sabio-light"
                }`}
                aria-label="Me gusta"
                title="Me gusta"
              >
                <Heart size={14} fill={liked ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                onClick={onOpenFeedback}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-anime-input text-cream-secondary transition hover:text-cream-primary"
                aria-label="Reemplazar"
                title="Reemplazar"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            <button
              type="button"
              onClick={onMoreLikeThis}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-anime-input text-cream-secondary transition hover:text-sabio-light"
              aria-label="Más como este"
              title="Más como este"
            >
              <Wand2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {feedbackOpen ? (
        <div className="border-t border-anime-border bg-anime-input/50 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cream-secondary">Ajustar</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(Object.keys(feedbackLabels) as Feedback[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onFeedback(item)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                  feedback === item ? "bg-sabio text-anime-main" : "bg-anime-main text-cream-secondary hover:text-cream-primary"
                }`}
              >
                {feedbackLabels[item]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onReplace}
            disabled={replacing}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-sabio-light transition hover:text-sabio disabled:opacity-50"
          >
            {replacing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Buscar alternativa
          </button>
        </div>
      ) : null}
    </article>
  );
};