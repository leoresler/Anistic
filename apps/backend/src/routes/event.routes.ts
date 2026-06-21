import type { FastifyPluginAsync } from "fastify";

import { userEventPayloadSchema } from "@template/shared";

import { getAuthUserId, requireAuth } from "../lib/auth";
import { recordUserEvent } from "../services/event.service";

const eventRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", requireAuth);

  app.post("/events", async (request, reply) => {
    const body = userEventPayloadSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ message: "Evento inválido" });

    await recordUserEvent({ userId: getAuthUserId(request), ...body.data });
    return { ok: true };
  });
};

export default eventRoutes;
