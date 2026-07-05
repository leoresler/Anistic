import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";

import { animeSorts, sortOrders } from "@template/shared";

import { requireAdmin } from "../lib/auth";
import { getAdminAnimeStats, listAnimes } from "../services/anime.service";

const adminAnimesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(48).default(24),
  search: z.string().optional(),
  visibility: z.enum(["all", "visible", "hidden"]).default("all"),
  hiddenReason: z.string().optional(),
  sort: z.enum(animeSorts).default("popularity"),
  order: z.enum(sortOrders).default("desc"),
});

const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get("/animes", { preHandler: requireAdmin }, async (request) => {
    const query = adminAnimesQuerySchema.parse(request.query);

    return listAnimes({
      page: query.page,
      limit: query.limit,
      search: query.search?.trim() || undefined,
      genres: [],
      sort: query.sort,
      order: query.order,
      viewerIsAdmin: true,
      visibility: query.visibility,
      hiddenReason: query.hiddenReason,
    });
  });

  app.get("/animes/stats", { preHandler: requireAdmin }, async () => getAdminAnimeStats());
};

export default adminRoutes;
