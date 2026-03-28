import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["node_modules/**", "tests/e2e/**", "**/*.spec.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
      exclude: ["src/app/**", "src/components/**"],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
