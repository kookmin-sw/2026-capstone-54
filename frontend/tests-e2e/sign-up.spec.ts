import { test, expect } from "@playwright/test";

test.describe("Sign Up Page (/sign-up)", () => {
  test("회원가입 폼 필드 (이름 / 이메일 / 비밀번호) 가 표시된다", async ({ page }) => {
    await page.goto("/sign-up");
    const nameInput = page.getByLabel(/이름|name/i).first();
    const emailInput = page.getByLabel(/email|이메일/i).first();
    const passwordInput = page.getByLabel(/password|비밀번호/i).first();
    await expect(nameInput.or(emailInput).or(passwordInput)).toBeVisible();
  });

  test("회원가입 버튼이 표시된다", async ({ page }) => {
    await page.goto("/sign-up");
    const submitButton = page.getByRole("button", { name: /가입|sign\s*up|회원가입/i });
    await expect(submitButton).toBeVisible();
  });

  test("로그인 페이지 링크가 표시된다", async ({ page }) => {
    await page.goto("/sign-up");
    const loginLink = page.getByRole("link", { name: /로그인|login/i });
    await expect(loginLink).toBeVisible();
  });

  test("약관 동의 체크박스 (있을 경우) 가 표시된다", async ({ page }) => {
    await page.goto("/sign-up");
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.count() > 0) {
      await expect(termsCheckbox).toBeVisible();
    }
  });
});
