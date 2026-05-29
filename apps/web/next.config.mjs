import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Load the monorepo root .env before Next.js initializes so NEXT_PUBLIC_* vars
// are available at build/dev start. Don't override already-set env vars.
const __dirname = dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: resolve(__dirname, "../../.env"), override: false });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // `standalone` is required by the Docker image (docker/web.Dockerfile copies
  // .next/standalone). It is skipped when NEXT_DISABLE_STANDALONE is set so local
  // builds on Windows don't hit EPERM creating symlinks without admin/Developer Mode.
  output: process.env.NEXT_DISABLE_STANDALONE ? undefined : "standalone",
  reactStrictMode: true,
  transpilePackages: ["@streamflare/types", "@streamflare/ui"],
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
