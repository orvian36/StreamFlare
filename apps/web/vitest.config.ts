import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const ui = (p: string) =>
  fileURLToPath(new URL(`../../packages/ui/src/${p}`, import.meta.url));

export default defineConfig({
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: [
      { find: /^@streamflare\/ui\/lib\/(.*)$/, replacement: ui("lib/$1") },
      { find: /^@streamflare\/ui\/components\/ui\/(.*)$/, replacement: ui("components/ui/$1") },
      { find: /^@streamflare\/ui\/components\/brand\/(.*)$/, replacement: ui("components/brand/$1") },
      { find: /^@streamflare\/ui\/components\/forms\/(.*)$/, replacement: ui("components/forms/$1") },
      { find: /^@streamflare\/ui\/motion$/, replacement: ui("motion/index.tsx") },
      { find: /^@streamflare\/ui$/, replacement: ui("index.ts") },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    server: {
      // Workspace package ships raw TSX; force Vitest to transform it.
      deps: { inline: [/@streamflare\/ui/] },
    },
  },
});
