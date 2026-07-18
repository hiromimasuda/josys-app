import { expect, test } from "@playwright/test";

// KPI: 代表事象から必要な業務詳細へ3クリック以内(§16 Gate 1通過条件)
test("ホームからWi-Fi障害の業務詳細まで3クリック", async ({ page }, testInfo) => {
  await page.goto("/home");
  let clicks = 0;

  // クリック1: 発生時アクションを開く
  // desktopはホームのCTA、mobileは下部タブ「発生時」(いずれも1クリック)
  if (testInfo.project.name === "mobile") {
    await page.getByRole("link", { name: "発生時", exact: true }).click();
  } else {
    await page.getByRole("link", { name: "発生時アクションを開く(15入口)" }).click();
  }
  clicks += 1;
  await expect(page).toHaveURL(/\/events$/);

  // クリック2: Wi-Fi・全社ネットワーク障害カード
  await page.getByRole("link", { name: /Wi-Fi・全社ネットワーク障害/ }).click();
  clicks += 1;
  await expect(page).toHaveURL(/\/events\/EV-04$/);

  // クリック3: 関連業務 1-1
  await page.getByTestId("related-operations").getByRole("link", { name: /1-1 Wi-Fi障害の一次対応/ }).click();
  clicks += 1;
  await expect(page).toHaveURL(/\/operations\/1-1$/);
  await expect(page.getByRole("heading", { name: /1-1 Wi-Fi障害の一次対応/ })).toBeVisible();

  expect(clicks).toBeLessThanOrEqual(3);
});
