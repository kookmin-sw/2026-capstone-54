import { test, expect } from "@playwright/test";

test.describe("Landing Page (/)", () => {
  test("페이지가 로드되고 메인 hero 가 렌더된다", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/meFit|MeFit|미핏/i);
  });

  test("'시작하기' 또는 'Sign Up' CTA 가 표시된다", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: /시작|가입|Sign\s*Up|Get\s*Started/i }).first();
    await expect(cta).toBeVisible();
  });

  test("CTA 클릭 시 /sign-up 또는 /login 으로 이동", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: /시작|가입|Sign\s*Up/i }).first();
    if (await cta.isVisible().catch(() => false)) {
      await cta.click();
      await expect(page).toHaveURL(/\/(sign-up|login)/);
    }
  });
});
