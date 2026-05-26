import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Load the monorepo root .env before Next.js initializes so NEXT_PUBLIC_* vars
// are available at build/dev start. Don't override already-set env vars.
const __dirname = dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: resolve(__dirname, "../../.env"), override: false });

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@streamflare/types"],
};

export default nextConfig;
