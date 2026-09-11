import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "src/__tests__/helpers/**"],
    globalSetup: ["src/__tests__/helpers/global-setup.ts"],
    testTimeout: 10000,
  },
});
