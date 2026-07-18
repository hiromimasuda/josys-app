import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@ops/domain": path.resolve(__dirname, "packages/domain/src/index.ts"),
      "@ops/ai": path.resolve(__dirname, "packages/ai/src/index.ts"),
      "@": path.resolve(__dirname, "apps/web/src"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
