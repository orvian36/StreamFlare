import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    setupFiles: ["./tests/helpers/setup.ts"],
    fileParallelism: false,
    testTimeout: 30000,
  },
});
