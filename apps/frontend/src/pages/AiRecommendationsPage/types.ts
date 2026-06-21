import type { AiRecommendation } from "@template/shared";

export type DisplayRecommendation = AiRecommendation & {
  id: string;
  replaced?: boolean;
};

export type Feedback = "muy-oscuro" | "muy-largo" | "no-es-mi-genero" | "ya-lo-vi" | "mala-animacion" | "sin-motivo";

export const feedbackLabels: Record<Feedback, string> = {
  "muy-oscuro": "Muy oscuro",
  "muy-largo": "Muy largo",
  "no-es-mi-genero": "No es mi género",
  "ya-lo-vi": "Ya lo vi",
  "mala-animacion": "Mala animación",
  "sin-motivo": "Sin motivo",
};
