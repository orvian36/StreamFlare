import { z } from "zod";

export const env = z
  .object({
    DATABASE_URL: z.string().min(1),
    PORT: z.coerce.number().default(5001),
    PYTHON_BIN: z.string().default("python"),
  })
  .parse(process.env);
