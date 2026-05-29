import { defineConfig } from "vitest/config";

export default defineConfig({
  esbuild: { jsx: "automatic" },
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
