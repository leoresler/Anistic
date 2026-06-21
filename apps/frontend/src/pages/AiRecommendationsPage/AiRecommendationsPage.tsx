import { startTransition, useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import type { AiRecommendation, AiRecommendationHistoryItem, AiRecommendationsPayload } from "@template/shared";

import { API_URL, aiApi } from "../../lib/api";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useAuthStore } from "../../store/auth.store";
import { appToast } from "../../utils/toast";
import { AiPromptPanel } from "./components/AiPromptPanel";
import { AiRecommendationCard } from "./components/AiRecommendationCard";
import { AiSkeletonCards } from "./components/AiSkeletonCards";
import { feedbackLabels, type DisplayRecommendation, type Feedback } from "./types";

const suggestions = [
  "algo como AOT pero menos oscuro y más shonen",
  "slice of life relajante, sin drama",
  "acción épica con gran animación",
  "romance con comedia, nada serio",
  "anime corto, menos de 15 episodios",
];

const surprisePrompts = [
  "Una joya oculta de los 2000 que casi nadie vio",
  "Algo con animación increíble y un final agridulce",
  "Un anime corto de menos de 13 episodios que se siente completo",
  "Algo gracioso pero con profundidad emocional inesperada",
  "Un isekai subestimado que realmente hace algo original",
  "Un anime de deportes emocionante aunque no te gusten los deportes",
  "Algo con un worldbuilding e historia increíbles",
  "Un anime lento que vale completamente la pena",
];

const createCardId = (recommendation: AiRecommendation, index: number) =>
  `${recommendation.title}-${recommendation.year ?? "sin-anio"}-${index}-${crypto.randomUUID()}`;

const toDisplayRecommendations = (recommendations: AiRecommendation[]) =>
  recommendations.map((recommendation, index) => ({
    ...recommendation,
    id: createCardId(recommendation, index),
  }));

const parseCompletedRecommendationObjects = (json: string) => {
  const marker = '"recommendations"';
  const markerIndex = json.indexOf(marker);
  if (markerIndex < 0) {
    return [];
  }

  const arrayStart = json.indexOf("[", markerIndex);
  if (arrayStart < 0) {
    return [];
  }

  const objects: AiRecommendation[] = [];
  let objectStart = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = arrayStart + 1; index < json.length; index += 1) {
    const char = json[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\" && inString) {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        objectStart = index;
      }
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0 && objectStart >= 0) {
        try {
          objects.push(JSON.parse(json.slice(objectStart, index + 1)) as AiRecommendation);
        } catch {
          return objects;
        }
      }
    }
  }

  return objects;
};

const parseFinalPayload = (json: string): AiRecommendationsPayload | null => {
  const trimmed = json.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed) as AiRecommendationsPayload;
  } catch {
    return null;
  }
};

const StreamingStatus = ({ status, active }: { status: string; active: boolean }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-anime-border bg-anime-input px-4 py-2 text-sm font-bold text-cream-secondary">
    {active ? <Loader2 size={16} className="animate-spin text-sabio" /> : <Sparkles size={16} className="text-sabio" />}
    {status}
  </div>
);

export const AiRecommendationsPage = () => {
  useDocumentTitle("Recomendaciones IA — Anistic");
  const token = useAuthStore((state) => state.token);
  const [prompt, setPrompt] = useState(suggestions[0]);
  const [status, setStatus] = useState("Listo para interpretar tus gustos.");
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<DisplayRecommendation[]>([]);
  const [history, setHistory] = useState<AiRecommendationHistoryItem[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(() => new Set());
  const [feedbackById, setFeedbackById] = useState<Record<string, Feedback | undefined>>({});
  const [feedbackPanelId, setFeedbackPanelId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const streamedJsonRef = useRef("");
  const shownCountRef = useRef(0);

  useEffect(() => {
    if (!token) {
      return;
    }

    let ignore = false;
    aiApi
      .history(token)
      .then((response) => {
        if (!ignore) {
          setHistory(response.items);
        }
      })
      .catch(() => appToast.error("No pudimos cargar tus búsquedas recientes"));

    return () => {
      ignore = true;
    };
  }, [token]);

  const refreshHistory = async () => {
    if (!token) {
      return;
    }

    try {
      const response = await aiApi.history(token);
      setHistory(response.items);
    } catch {
      appToast.error("No pudimos actualizar el historial");
    }
  };

  const streamRecommendations = async (
    query: string,
    onPartialRecommendation?: (recommendation: AiRecommendation) => void,
  ) => {
    if (!token) {
      throw new Error("Necesitás iniciar sesión para buscar recomendaciones");
    }

    const response = await fetch(`${API_URL}/api/ai/recommendations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok || !response.body) {
      throw new Error("No pudimos iniciar la búsqueda");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = "";
    let eventName = "message";
    let receivedFirstChunk = false;

    const consumeEvent = (rawEvent: string) => {
      const lines = rawEvent.split(/\r?\n/);
      let data = "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventName = line.slice("event:".length).trim();
          continue;
        }

        if (line.startsWith("data:")) {
          data += line.slice("data:".length);
        }
      }

      if (eventName === "error") {
        const message = data ? (JSON.parse(data) as { message?: string }).message : null;
        throw new Error(message ?? "Falló la recomendación");
      }

      if (eventName === "end") {
        eventName = "message";
        return;
      }

      if (!data) {
        return;
      }

      if (!receivedFirstChunk) {
        receivedFirstChunk = true;
        setStatus("Buscando recomendaciones...");
      }

      streamedJsonRef.current += data;
      const completed = parseCompletedRecommendationObjects(streamedJsonRef.current);
      for (const recommendation of completed.slice(shownCountRef.current)) {
        shownCountRef.current += 1;
        onPartialRecommendation?.(recommendation);
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      sseBuffer += decoder.decode(value, { stream: true });
      const events = sseBuffer.split(/\n\n/);
      sseBuffer = events.pop() ?? "";
      for (const event of events) {
        consumeEvent(event);
      }
    }

    const tail = decoder.decode();
    if (tail) {
      sseBuffer += tail;
    }

    if (sseBuffer.trim()) {
      consumeEvent(sseBuffer);
    }

    const finalPayload = parseFinalPayload(streamedJsonRef.current);
    if (finalPayload) {
      return finalPayload;
    }

    const parsedRecommendations = parseCompletedRecommendationObjects(streamedJsonRef.current);
    if (parsedRecommendations.length > 0) {
      return {
        interpretation: null,
        recommendations: parsedRecommendations,
      };
    }

    throw new Error("La IA devolvió una respuesta incompleta. Probá de nuevo con una búsqueda más corta.");
  };

  const submitPrompt = async (query = prompt) => {
    const cleanQuery = query.trim();
    if (cleanQuery.length < 3) {
      appToast.warning("Escribí al menos 3 caracteres");
      return;
    }

    streamedJsonRef.current = "";
    shownCountRef.current = 0;
    setPrompt(cleanQuery);
    setIsStreaming(true);
    setInterpretation(null);
    setRecommendations([]);
    setStatus("Interpretando tu búsqueda...");

    try {
      const payload = await streamRecommendations(cleanQuery, (recommendation) => {
        startTransition(() => {
          setRecommendations((current) => {
            if (current.some((item) => item.title === recommendation.title)) {
              return current;
            }
            return [...current, { ...recommendation, id: createCardId(recommendation, current.length) }];
          });
        });
      });

      setInterpretation(payload.interpretation);
      setRecommendations((current) => {
        if (current.length > 0) {
          return current;
        }
        return toDisplayRecommendations(payload.recommendations);
      });
      setStatus("Recomendaciones listas.");
      if (!payload.interpretation) {
        appToast.warning("La IA devolvió una respuesta parcial, pero recuperamos las recomendaciones disponibles");
      }
      void refreshHistory();
    } catch (error) {
      setStatus("No pudimos completar la búsqueda.");
      appToast.error(error instanceof Error ? error.message : "No pudimos completar la búsqueda");
    } finally {
      setIsStreaming(false);
    }
  };

  const replaceRecommendation = async (recommendation: DisplayRecommendation) => {
    const feedback = feedbackById[recommendation.id];
    const extra = feedback ? `, pero necesito una alternativa ${feedbackLabels[feedback].toLowerCase()}` : ", pero dame una alternativa distinta";
    const query = `${prompt}. Reemplazá ${recommendation.title}${extra}.`;

    streamedJsonRef.current = "";
    shownCountRef.current = 0;
    setReplacingId(recommendation.id);

    try {
      const payload = await streamRecommendations(query);
      const [replacement] = payload.recommendations;
      if (!replacement) {
        throw new Error("No llegó una alternativa válida");
      }

      setRecommendations((current) =>
        current.map((item) =>
          item.id === recommendation.id
            ? { ...replacement, id: createCardId(replacement, current.length), replaced: true }
            : item,
        ),
      );
      appToast.success("Alternativa encontrada");
      void refreshHistory();
    } catch (error) {
      appToast.error(error instanceof Error ? error.message : "No pudimos buscar una alternativa");
    } finally {
      setReplacingId(null);
    }
  };

  const surprise = () => {
    const nextPrompt = surprisePrompts[Math.floor(Math.random() * surprisePrompts.length)];
    void submitPrompt(nextPrompt);
  };

const displayedRecommendations = recommendations.slice(0, 6);

  return (
    <main className="min-h-screen px-5 pt-10 pb-8 text-cream-primary sm:px-8 lg:px-10">
      <section className="relative z-10 mx-auto max-w-350">
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
          <AiPromptPanel
            prompt={prompt}
            disabled={isStreaming}
            onPromptChange={setPrompt}
            onSubmit={() => void submitPrompt()}
            onClear={() => {
              setPrompt("");
              setRecommendations([]);
              setInterpretation(null);
              setStatus("Listo para interpretar tus gustos.");
            }}
            onSurprise={surprise}
            suggestions={suggestions}
            history={history}
            onHistoryClick={(query) => void submitPrompt(query)}
          />

          <div className="min-w-0 space-y-4">
            {recommendations.length > 0 && (
              <div className="flex items-center gap-3">
                <StreamingStatus status={status} active={isStreaming} />
                <p className="text-xs font-bold text-cream-secondary">{recommendations.length} recomendaciones</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {recommendations.length === 0 && isStreaming ? <AiSkeletonCards /> : null}
              {recommendations.length === 0 && !isStreaming && (
                <div className="col-span-full rounded-2xl border border-dashed border-anime-border bg-anime-input/50 p-8 text-center text-sm font-semibold text-cream-secondary">
                  Escribí una vibra, referencia o antojo narrativo. La IA devuelve recomendaciones con motivo y afinidad.
                </div>
              )}
              {displayedRecommendations.map((recommendation, index) => (
                <AiRecommendationCard
                  key={recommendation.id}
                  recommendation={recommendation}
                  index={index}
                  liked={likedIds.has(recommendation.id)}
                  feedback={feedbackById[recommendation.id]}
                  feedbackOpen={feedbackPanelId === recommendation.id}
                  replacing={replacingId === recommendation.id}
                  onToggleLike={() => {
                    setLikedIds((current) => {
                      const next = new Set(current);
                      if (next.has(recommendation.id)) {
                        next.delete(recommendation.id);
                      } else {
                        next.add(recommendation.id);
                      }
                      return next;
                    });
                  }}
                  onFeedback={(feedback) => setFeedbackById((current) => ({ ...current, [recommendation.id]: feedback }))}
                  onOpenFeedback={() =>
                    setFeedbackPanelId((current) => (current === recommendation.id ? null : recommendation.id))
                  }
                  onMoreLikeThis={() => void submitPrompt(`Más anime como ${recommendation.title}: ${recommendation.reason}`)}
                  onReplace={() => void replaceRecommendation(recommendation)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
