import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schema";

const { Pool } = pg;

export const createDb = (connectionString = process.env.DATABASE_URL) => {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString });

  return {
    db: drizzle(pool, { schema }),
    pool,
  };
};

export type Database = ReturnType<typeof createDb>["db"];
