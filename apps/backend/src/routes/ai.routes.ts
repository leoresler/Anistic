import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { aiRecommendationsRequestSchema } from "@template/shared";

import { env } from "../env";
import { extractRecommendationsPayload, parseGroqStreamLine } from "../lib/ai-recommendations";
import { extractBearerToken } from "../lib/auth-token";
import { enrichRecommendationsWithAnime, getAiRecommendationHistory, saveAiRecommendationSearch } from "../services/ai-recommendations.service";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const SYSTEM_PROMPT = `You are an anime expert with encyclopedic knowledge. When the user describes what they want to watch, respond ONLY with valid JSON, no markdown, no codeblocks, no explanation. Use this exact format:
{
  "interpretation": "brief explanation in the same language the user wrote in",
  "recommendations": [
    {
      "title": "anime title",
      "year": 2021,
      "genres": ["Genre1", "Genre2"],
      "episodes": 24,
      "reason": "why this matches what the user asked for, in the same language the user wrote in",
      "similarity_score": 0.92
    }
  ]
}
Return exactly 5 recommendations ordered by similarity_score descending.`;

type AuthenticatedRequest = FastifyRequest & { userId: string };

const authenticate = async (app: FastifyInstance, request: FastifyRequest, reply: FastifyReply) => {
  const token = extractBearerToken(request.headers.authorization);
  if (!token) {
    await reply.status(401).send({ message: "Token requerido" });
    return false;
  }

  try {
    const payload = await app.jwt.verify<{ sub: string }>(token);
    (request as AuthenticatedRequest).userId = payload.sub;
    return true;
  } catch {
    await reply.status(401).send({ message: "Token invalido" });
    return false;
  }
};

const writeSse = (reply: FastifyReply, event: string | null, data: unknown) => {
  if (event) {
    reply.raw.write(`event: ${event}\n`);
  }

  const payload = typeof data === "string" ? data : JSON.stringify(data);
  for (const line of payload.split("\n")) {
    reply.raw.write(`data: ${line}\n`);
  }
  reply.raw.write("\n");
};

const startSse = (reply: FastifyReply) => {
  reply.hijack();
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
    "Access-Control-Allow-Origin": env.FRONTEND_URL,
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  });
};

export default async function aiRoutes(app: FastifyInstance) {
  app.post("/recommendations", async (request, reply) => {
    if (!(await authenticate(app, request, reply))) {
      return;
    }

    const parsedBody = aiRecommendationsRequestSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.status(400).send({ message: parsedBody.error.issues[0]?.message ?? "Búsqueda inválida" });
    }

    startSse(reply);

    try {
      const groqResponse = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          stream: true,
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 1000,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: parsedBody.data.query },
          ],
        }),
      });

      if (!groqResponse.ok || !groqResponse.body) {
        writeSse(reply, "error", { message: "No pudimos conectar con el recomendador" });
        reply.raw.end();
        return;
      }

      const reader = groqResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completedJson = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const content = parseGroqStreamLine(line);
          if (!content) {
            continue;
          }

          completedJson += content;
          writeSse(reply, null, content);
        }
      }

      const tail = decoder.decode();
      if (tail) {
        buffer += tail;
      }

      for (const line of buffer.split(/\r?\n/)) {
        const content = parseGroqStreamLine(line);
        if (!content) {
          continue;
        }

        completedJson += content;
        writeSse(reply, null, content);
      }

      writeSse(reply, "end", { ok: true });
      reply.raw.end();

      queueMicrotask(async () => {
        try {
          const payload = extractRecommendationsPayload(completedJson);
          const enrichedRecommendations = await enrichRecommendationsWithAnime(payload.recommendations);
          void saveAiRecommendationSearch({
            userId: (request as AuthenticatedRequest).userId,
            query: parsedBody.data.query,
            interpretation: payload.interpretation,
            recommendations: enrichedRecommendations,
          }).catch((error: unknown) => request.log.error({ error }, "Failed to save AI recommendation search"));
        } catch (error) {
          request.log.error({ error }, "Failed to parse AI recommendation search");
        }
      });
    } catch (error) {
      request.log.error({ error }, "Failed while streaming AI recommendations");
      writeSse(reply, "error", { message: "Se cortó la respuesta del recomendador" });
      reply.raw.end();
    }
  });

  app.get("/recommendations/history", async (request, reply) => {
    if (!(await authenticate(app, request, reply))) {
      return;
    }

    const items = await getAiRecommendationHistory((request as AuthenticatedRequest).userId);
    return reply.send({ items });
  });
}
