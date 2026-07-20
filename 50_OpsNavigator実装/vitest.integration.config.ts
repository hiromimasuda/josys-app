import path from "node:path";
import { defineConfig } from "vitest/config";

// integrationテスト: DEMO_ONLYローカルDB(127.0.0.1)が必要。
// 実行前に `pnpm db:up && pnpm db:migrate && pnpm db:seed` を行うこと。
process.env.DATABASE_URL ??=
  "postgresql://opsnav_demo:opsnav_demo_only_local@127.0.0.1:5432/opsnav_demo"; // DEMO_ONLY

export default defineConfig({
  resolve: {
    alias: {
      "@ops/domain": path.resolve(__dirname, "packages/domain/src/index.ts"),
      "@ops/ai": path.resolve(__dirname, "packages/ai/src/index.ts"),
      "@ops/db": path.resolve(__dirname, "packages/db/src/index.ts"),
      "@ops/integrations": path.resolve(__dirname, "packages/integrations/src/index.ts"),
      "@": path.resolve(__dirname, "apps/web/src"),
    },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
