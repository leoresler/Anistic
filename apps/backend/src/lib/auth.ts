import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";

import { createDb, users } from "@template/database";

import { env } from "../env";

export const { db } = createDb(env.DATABASE_URL);

type JwtPayload = {
  sub?: string;
};

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ message: "No autorizado" });
  }
};

export const tryAuth = async (request: FastifyRequest) => {
  try {
    await request.jwtVerify();
  } catch {
    delete (request as { user?: unknown }).user;
  }
};

export const getAuthUserId = (request: FastifyRequest) => {
  const user = request.user as JwtPayload | undefined;
  if (!user?.sub) {
    throw new Error("No autorizado");
  }

  return user.sub;
};

export const getOptionalAuthUserId = (request: FastifyRequest) => {
  const user = request.user as JwtPayload | undefined;
  return user?.sub ?? null;
};

export const isAdminUser = async (request: FastifyRequest): Promise<boolean> => {
  const userId = getOptionalAuthUserId(request);
  if (!userId) return false;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { isAdmin: true },
  });

  return user?.isAdmin ?? false;
};

export const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  await requireAuth(request, reply);
  if (reply.sent) return;

  const userId = getAuthUserId(request);
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return reply.status(403).send({ message: "Requiere permisos de administrador" });
  }
};
