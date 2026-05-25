import { resolve } from "node:path";

const dbPath = resolve(process.cwd(), "test.db").replace(/\\/g, "/");
process.env.DATABASE_URL = `file:${dbPath}`;
process.env.JWT_SECRET = "test-secret-min-16-chars-please";
process.env.TMDB_API_KEY = "test-tmdb-key";
process.env.ML_SERVICE_URL = "http://localhost:5001";
