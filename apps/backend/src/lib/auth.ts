import type { FastifyReply, FastifyRequest } from "fastify";

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
