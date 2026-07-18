import { defineConfig } from "@playwright/test";

// ブラウザは環境にプリインストールされたChromiumを使用(追加ダウンロードなし)。
const executablePath = process.env.OPSNAV_CHROMIUM ?? "/opt/pw-browsers/chromium";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3111",
    launchOptions: { executablePath },
  },
  projects: [
    {
      name: "desktop",
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      // モバイル幅検証(390x844)。isMobileエミュレーションは固定要素の
      // ヒットテストが不安定なため使用せず、幅ベースで検証する。
      // 実機タッチ操作の確認は残課題としてGATE_1_REPORTに記載。
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
      },
    },
  ],
  webServer: {
    command: "pnpm --filter web start",
    url: "http://127.0.0.1:3111/home",
    reuseExistingServer: true,
    timeout: 60_000,
    env: { PORT: "3111", HOSTNAME: "127.0.0.1", NEXT_TELEMETRY_DISABLED: "1" },
  },
});
