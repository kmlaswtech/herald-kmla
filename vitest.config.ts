import { defineConfig } from "vitest/config";

// Every test exercises server or model code, so no DOM environment is needed.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    globals: false,
    include: ["test/**/*.test.ts"],
    silent: "passed-only",
  },
});
