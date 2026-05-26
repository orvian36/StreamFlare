import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { z } from "zod";

// Load the monorepo root .env (../../../.env relative to src/services/env.ts).
// Don't override values already set in the environment (e.g. by Docker compose).
const __dirname = dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: resolve(__dirname, "../../../../.env"), override: false });

export const env = z
  .object({
    DATABASE_URL: z.string().min(1),
    PORT: z.coerce.number().default(5001),
    PYTHON_BIN: z.string().default("python"),
  })
  .parse(process.env);
