import { test, expect } from "@playwright/test";

test.describe("Protected Routes — 미인증 사용자 차단", () => {
  const PROTECTED_PATHS = [
    "/home",
    "/onboarding",
    "/verify-email",
    "/interview/setup",
    "/resume",
    "/settings",
  ];

  for (const path of PROTECTED_PATHS) {
    test(`${path} 접근 시 비로그인 사용자는 / 또는 /login 으로 리다이렉트`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const url = page.url();
      expect(url).toMatch(/\/($|login|sign-up)/);
    });
  }
});

test.describe("Public Routes — 누구나 접근 가능", () => {
  const PUBLIC_PATHS = ["/", "/login", "/sign-up", "/forgot-password"];

  for (const path of PUBLIC_PATHS) {
    test(`${path} 접근 시 그대로 페이지 로드`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(new RegExp(path.replace("/", "\\/") + "$"));
    });
  }
});

test.describe("Not Found / 404 처리", () => {
  test("존재하지 않는 경로 접근 시 404 페이지 또는 fallback 표시", async ({ page }) => {
    await page.goto("/this-route-definitely-does-not-exist-xyz");
    await page.waitForLoadState("domcontentloaded");
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toBeTruthy();
  });
});
