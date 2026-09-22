import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 30000,
    hookTimeout: 30000,
    globals: false,
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    reporters: ["verbose"],
  },
});
