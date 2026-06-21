import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { defineConfig } from "drizzle-kit";

const backendEnvFile = new URL("../../apps/backend/.env", import.meta.url);

if (existsSync(backendEnvFile)) {
  loadEnvFile(backendEnvFile);
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/template",
  },
});
