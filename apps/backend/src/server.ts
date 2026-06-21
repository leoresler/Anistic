import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify from "fastify";

import { env } from "./env";
import aiRoutes from "./routes/ai.routes";
import addonRoutes from "./routes/addon.routes";
import animeRoutes from "./routes/anime.routes";
import authRoutes from "./routes/auth.routes";
import eventRoutes from "./routes/event.routes";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: env.FRONTEND_URL,
  credentials: true,
});

await app.register(jwt, {
  secret: env.JWT_SECRET,
});

app.get("/health", async () => ({ ok: true }));
await app.register(aiRoutes, { prefix: "/api/ai" });
await app.register(animeRoutes, { prefix: "/api" });
await app.register(addonRoutes, { prefix: "/api" });
await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(eventRoutes, { prefix: "/api" });

await app.listen({ port: env.BACKEND_PORT, host: "0.0.0.0" });
