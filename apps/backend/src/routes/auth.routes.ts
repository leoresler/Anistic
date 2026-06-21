import type { FastifyError, FastifyPluginAsync } from "fastify";
import { ZodError, type ZodSchema } from "zod";

import { emailAuthSchema, googleAuthSchema, phoneAuthSchema } from "@template/shared";

import { extractBearerToken } from "../lib/auth-token";
import { getUserById, loginEmail, loginGoogle, loginPhone, registerEmail, registerPhone } from "../services/auth.service";

const parseBody = <T>(schema: ZodSchema<T>, body: unknown) => schema.parse(body);

const authRoutes: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error: FastifyError | ZodError, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({ message: "Payload invalido", issues: error.issues });
    }

    return reply.status(400).send({ message: error.message });
  });

  app.post("/register-email", async (request, reply) => {
    const response = await registerEmail(app, parseBody(emailAuthSchema, request.body));
    return reply.status(201).send(response);
  });

  app.post("/login-email", async (request) => {
    return loginEmail(app, parseBody(emailAuthSchema, request.body));
  });

  app.post("/register-phone", async (request, reply) => {
    const response = await registerPhone(app, parseBody(phoneAuthSchema, request.body));
    return reply.status(201).send(response);
  });

  app.post("/login-phone", async (request) => {
    return loginPhone(app, parseBody(phoneAuthSchema, request.body));
  });

  app.post("/google", async (request) => {
    return loginGoogle(app, parseBody(googleAuthSchema, request.body));
  });

  app.get("/me", async (request, reply) => {
    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      return reply.status(401).send({ message: "Token requerido" });
    }

    try {
      const payload = app.jwt.verify<{ sub: string }>(token);
      const user = await getUserById(payload.sub);

      if (!user) {
        return reply.status(401).send({ message: "Sesion invalida" });
      }

      return { user };
    } catch {
      return reply.status(401).send({ message: "Sesion invalida" });
    }
  });
};

export default authRoutes;
