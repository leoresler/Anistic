import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { z } from "zod";

const envFile = new URL("../.env", import.meta.url);

if (existsSync(envFile)) {
  loadEnvFile(envFile);
}

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must have at least 16 characters"),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  BACKEND_PORT: z.coerce.number().int().positive().default(3333),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  ADMIN_EMAIL: z.string().email().optional(),
});

export const env = envSchema.parse(process.env);
