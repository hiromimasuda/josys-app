import { test } from "@playwright/test";

// desktop/mobileスクリーンショット(Gate 1必須証跡)。projects名ごとに保存先を分ける。
const pages: [string, string][] = [
  ["/home", "home"],
  ["/events", "events"],
  ["/events/EV-04", "event-detail-wifi"],
  ["/operations", "operations"],
  ["/operations/1-1", "operation-detail"],
  ["/cases", "cases"],
  ["/cases/CASE-DEMO-003", "case-detail-r3"],
  ["/cases/new", "case-new"],
  ["/calendar", "calendar"],
  ["/knowledge", "knowledge"],
  ["/approvals", "approvals"],
  ["/handover", "handover"],
  ["/emergency", "emergency"],
];

for (const [path, name] of pages) {
  test(`screenshot: ${name}`, async ({ page }, testInfo) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: `screenshots/${testInfo.project.name}/${name}.png`,
      fullPage: true,
    });
  });
}

test("screenshot: ask-with-answer", async ({ page }, testInfo) => {
  await page.goto("/ask");
  await page.getByRole("button", { name: "全社のWi-Fiがつながらない" }).click();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: `screenshots/${testInfo.project.name}/ask-answer.png`,
    fullPage: true,
  });
});
