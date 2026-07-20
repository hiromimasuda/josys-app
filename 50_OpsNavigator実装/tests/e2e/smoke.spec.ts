import { expect, test } from "@playwright/test";

test.describe("主要画面スモーク", () => {
  test("ホームは優先情報のみを表示する(AC-001相当)", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByRole("heading", { name: "今日の情シス" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /A0未完了・重大アラート/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /本日期限・3日以内のA1/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /承認待ち/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /次の30日/ })).toBeVisible();
    // 全43業務の巨大表を出さない
    await expect(page.getByText("全43件中")).toHaveCount(0);
    // R3の注意表示
    await expect(page.getByText(/R3\(緊急封じ込め\)対応中/)).toBeVisible();
    // 11/43/15検証フッター
    await expect(page.getByTestId("seed-counts")).toHaveText("11フロー / 43業務 / 15入口");
  });

  test("発生時アクションに15カードすべて表示", async ({ page }) => {
    await page.goto("/events");
    await expect(page.getByTestId("event-cards").locator("> li")).toHaveCount(15);
  });

  test("業務43: 初任者モード解除で全43件", async ({ page }) => {
    await page.goto("/operations");
    await page.getByLabel(/初任者モード/).uncheck();
    await expect(page.getByTestId("operations-count")).toContainText("43件を表示");
  });

  test("AI相談mock: 既知(出典あり)と未知(一般論のみ)を分離(AC-009/010相当)", async ({ page }) => {
    await page.goto("/ask");
    await page.getByRole("button", { name: "全社のWi-Fiがつながらない" }).click();
    const answer = page.getByTestId("ai-answer");
    await expect(answer.getByRole("heading", { name: /社内で確定していること/ })).toBeVisible();
    await expect(answer.getByText("DEMO 承認済み障害Runbook")).toBeVisible();

    await page.getByRole("button", { name: "見たことがないSaaSのエラーが出ている" }).click();
    await expect(answer.getByText(/社内正本から確定した回答は見つかりませんでした/)).toBeVisible();
    await expect(answer.getByText("一般的推奨・社内適用は要確認").first()).toBeVisible();
  });

  test("ケース作成: 禁止入力(秘密らしき文字列)をブロック", async ({ page }) => {
    await page.goto("/cases/new?event=EV-09");
    await page.getByLabel(/影響対象/).fill("テストユーザー1名");
    await page.getByLabel(/概要/).fill("password: hunter2 を教えてほしい");
    await page.getByRole("button", { name: /ケースを作成/ }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("入力できません");
  });

  test("ケース詳細: R3は承認・証跡の必須表示(AC-012/013相当の予告)", async ({ page }) => {
    await page.goto("/cases/CASE-DEMO-003");
    await expect(page.getByText(/R3: 承認または緊急封じ込め記録/)).toBeVisible();
  });

  test("正本競合ケースは要突合を表示(AC-010相当)", async ({ page }) => {
    await page.goto("/cases/CASE-DEMO-004");
    await expect(page.getByText(/要突合: このケースの根拠となる正本が競合しています/)).toBeVisible();
  });
});
