import { expect, test } from "@playwright/test";

// AC-018相当: オフラインでEmergency Packを開ける(§13)
test("Emergency Packはオフラインで再読込できる", async ({ page, context }) => {
  await page.goto("/emergency");
  await expect(page.getByRole("heading", { name: /緊急パック/ })).toBeVisible();

  // Service Workerがページを制御するまで待つ
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true });
        reg.active?.postMessage("ping");
        setTimeout(resolve, 2000);
      });
    }
  });
  // precache完了を待つ
  await page.waitForFunction(async () => {
    const cache = await caches.open("opsnav-emergency-v1");
    return (await cache.match("/emergency")) !== undefined;
  });

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: /緊急パック/ })).toBeVisible();
  await expect(page.getByText(/現在オフラインです/)).toBeVisible();
  // 15入口がオフラインでも見える
  await expect(page.getByText("Wi-Fi・全社ネットワーク障害").first()).toBeVisible();
  await context.setOffline(false);
});
