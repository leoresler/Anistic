import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extractRecommendationsPayload, parseGroqStreamLine } from "./ai-recommendations";

describe("parseGroqStreamLine", () => {
  it("returns delta content from an OpenAI-compatible SSE data line", () => {
    const line = 'data: {"choices":[{"delta":{"content":"Naruto"}}]}';

    assert.equal(parseGroqStreamLine(line), "Naruto");
  });

  it("ignores done markers, empty lines, and malformed JSON", () => {
    assert.equal(parseGroqStreamLine("data: [DONE]"), null);
    assert.equal(parseGroqStreamLine(""), null);
    assert.equal(parseGroqStreamLine("data: nope"), null);
  });
});

describe("extractRecommendationsPayload", () => {
  it("parses interpretation and recommendations from completed model JSON", () => {
    const payload = extractRecommendationsPayload(JSON.stringify({
      interpretation: "Shonen oscuro con buen ritmo",
      recommendations: [
        {
          title: "Jujutsu Kaisen",
          year: 2020,
          episodes: 24,
          genres: ["Acción", "Sobrenatural"],
          reason: "Combina peleas tácticas y humor seco.",
          similarity_score: 0.92,
        },
      ],
    }));

    assert.deepEqual(payload, {
      interpretation: "Shonen oscuro con buen ritmo",
      recommendations: [
        {
          title: "Jujutsu Kaisen",
          year: 2020,
          episodes: 24,
          genres: ["Acción", "Sobrenatural"],
          reason: "Combina peleas tácticas y humor seco.",
          similarity_score: 0.92,
        },
      ],
    });
  });
});
