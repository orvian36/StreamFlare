import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),
  TMDB_API_KEY: z.string().min(1),
  ML_SERVICE_URL: z.string().url().default("http://localhost:5001"),
  PORT: z.coerce.number().default(5000),
});

export const env = envSchema.parse(process.env);
