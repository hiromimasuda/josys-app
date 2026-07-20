import { expect, test, type Page } from "@playwright/test";

// Gate 2の統制フローをUI経由で検証する。
// テストごとに新しいケースを作成し、seedのDEMOケースは変更しない。

async function switchUser(page: Page, userId: string) {
  await page.getByLabel("DEMOユーザー切替(mock auth)").selectOption(userId);
}

test("R2ケース: 証跡→承認→完了のサーバー側ガード(AC-012/017/018相当)", async ({ page }, testInfo) => {
  const marker = `E2E-${testInfo.project.name}-approval`;

  // 1. ケース作成(EV-08 Drive外部共有 → R2)
  await page.goto("/cases/new?event=EV-08");
  await page.getByLabel(/影響対象/).fill(marker);
  await page.getByRole("button", { name: /ケースを作成/ }).click();
  await expect(page).toHaveURL(/\/cases\/CASE-\d{4}$/);
  const caseUrl = page.url();

  // 2. 証跡なしで完了 → サーバーが409で拒否
  await page.getByTestId("complete-button").click();
  await expect(page.getByTestId("case-error")).toContainText("必須証跡");

  // 3. 必須3種の証跡を追加
  for (const kind of ["BEFORE", "AFTER", "USER_CONFIRMATION"]) {
    await page.locator("#evkind").selectOption(kind);
    await page.getByRole("button", { name: "証跡を追加" }).click();
    await expect(page.getByRole("status")).toContainText("証跡を追加しました");
  }

  // 4. 証跡はあるが承認なし → 拒否
  await page.getByTestId("complete-button").click();
  await expect(page.getByTestId("case-error")).toContainText("承認なしで完了できません");

  // 5. 承認依頼 → 承認者へ切替えて承認(他ロールでは判断できない)
  await page.getByRole("button", { name: "承認を依頼" }).click();
  await expect(page.getByRole("status")).toContainText("承認を依頼しました");

  await switchUser(page, "USR-DEMO-003"); // DEMO_APPROVER
  await page.goto("/approvals");
  const row = page.locator("li", { hasText: marker }).first();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "承認する" }).click();
  await expect(page.getByRole("status")).toContainText("承認しました");

  // 6. オペレーターへ戻して完了 → 成功
  await switchUser(page, "USR-DEMO-002");
  await page.goto(caseUrl);
  await page.getByTestId("complete-button").click();
  await expect(page.getByRole("status")).toContainText("ケースを完了しました");
  await expect(page.getByText("完了", { exact: true })).toBeVisible();
});

test("承認者以外の判断はサーバーが403で拒否(AC-018相当)", async ({ page }, testInfo) => {
  const marker = `E2E-${testInfo.project.name}-deny`;
  await page.goto("/cases/new?event=EV-08");
  await page.getByLabel(/影響対象/).fill(marker);
  await page.getByRole("button", { name: /ケースを作成/ }).click();
  await expect(page).toHaveURL(/\/cases\/CASE-\d{4}$/);
  await page.getByRole("button", { name: "承認を依頼" }).click();
  await expect(page.getByRole("status")).toContainText("承認を依頼しました");

  // operatorのまま承認を試みる → 403
  await page.goto("/approvals");
  const row = page.locator("li", { hasText: marker }).first();
  await row.getByRole("button", { name: "承認する" }).click();
  await expect(page.getByTestId("approval-error")).toContainText("権限がありません");
});

test("管理画面: 非adminはサーバー403、adminは表示(AC-022相当)", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByTestId("admin-denied")).toBeVisible();

  await switchUser(page, "USR-DEMO-007"); // DEMO_ADMIN
  await expect(page.getByTestId("admin-summary")).toBeVisible();
  await expect(page.getByTestId("admin-summary")).toContainText("11フロー / 43業務 / 15入口");
  await expect(page.getByTestId("admin-summary")).toContainText("EXTERNAL_WRITES_ENABLED: false");

  await switchUser(page, "USR-DEMO-002");
});

test("検索: 要突合/AI未使用ラベル、employeeはRESTRICTED不可視(AC-010/014相当)", async ({ page }) => {
  await page.goto("/knowledge");
  await page.getByLabel("検索語").fill("外部共有");
  await page.getByRole("button", { name: "検索", exact: true }).click();
  const results = page.getByTestId("search-results");
  await expect(results.getByText("要突合(競合)")).toHaveCount(2);
  await expect(results.getByText("AI回答には未使用").first()).toBeVisible();

  // employeeへ切替 → RESTRICTED資料はタイトルも返らない
  await switchUser(page, "USR-DEMO-001");
  await page.getByRole("button", { name: "検索", exact: true }).click();
  await expect(page.getByText(/該当する資料が見つかりませんでした/)).toBeVisible();
  await switchUser(page, "USR-DEMO-002");
});

test("AI相談: 正本競合は統合せず要突合として併記(AC-010相当)", async ({ page }) => {
  await page.goto("/ask");
  await page.getByRole("button", { name: "Driveの外部共有を設定したい" }).click();
  await expect(page.getByTestId("conflict-warning")).toBeVisible();
  await expect(page.getByTestId("conflict-warning")).toContainText("DEMO 外部共有方針A");
  await expect(page.getByTestId("conflict-warning")).toContainText("DEMO 外部共有方針B");
});

test("引継ぎ: 実動作・証跡なしの受領はサーバーが拒否(AC-021相当)", async ({ page }, testInfo) => {
  await page.goto("/handover");
  const scenario = `E2E-${testInfo.project.name}-受領テスト`;
  await page.getByLabel("シナリオ").fill(scenario);
  await page.getByRole("button", { name: "記録する" }).click();
  await expect(page.getByTestId("handover-error")).toContainText("実動作");

  await page.getByLabel("実動作を実施した").check();
  await page.getByLabel(/証跡リンクあり/).check();
  await page.getByRole("button", { name: "記録する" }).click();
  await expect(page.getByRole("status")).toContainText("記録しました");
  await expect(page.getByTestId("acceptance-list")).toContainText(scenario);
});
