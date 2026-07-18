import { expect, test } from "@playwright/test";

// 外部runtime通信0件の検証(06チェックリスト Gate 1)
test("主要画面の遷移で外部への通信が発生しない", async ({ page }) => {
  const externalRequests: string[] = [];
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
      externalRequests.push(req.url());
    }
  });

  for (const path of [
    "/home",
    "/events",
    "/events/EV-04",
    "/operations",
    "/operations/1-1",
    "/cases",
    "/cases/CASE-DEMO-001",
    "/cases/new",
    "/calendar",
    "/ask",
    "/knowledge",
    "/approvals",
    "/handover",
    "/admin",
    "/emergency",
    "/menu",
  ]) {
    await page.goto(path);
  }
  // AI mockも外部通信なし
  await page.goto("/ask");
  await page.getByRole("button", { name: "全社のWi-Fiがつながらない" }).click();
  await page.waitForTimeout(500);

  expect(externalRequests).toEqual([]);
});
