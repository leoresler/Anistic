import { aiRecommendationsPayloadSchema, type AiRecommendationsPayload } from "@template/shared";

export const parseGroqStreamLine = (line: string): string | null => {
  if (!line.startsWith("data:")) {
    return null;
  }

  const data = line.slice("data:".length).trim();
  if (!data || data === "[DONE]") {
    return null;
  }

  try {
    const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: unknown } }> };
    const content = parsed.choices?.[0]?.delta?.content;
    return typeof content === "string" ? content : null;
  } catch {
    return null;
  }
};

export const extractRecommendationsPayload = (content: string): AiRecommendationsPayload => {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
  return aiRecommendationsPayloadSchema.parse(JSON.parse(trimmed));
};
