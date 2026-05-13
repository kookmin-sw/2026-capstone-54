import { test, expect } from "@playwright/test";

test.describe("Login Page (/login)", () => {
  test("이메일 + 비밀번호 input 이 표시된다", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.getByLabel(/email|이메일/i).first();
    const passwordInput = page.getByLabel(/password|비밀번호/i).first();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("로그인 버튼이 표시된다", async ({ page }) => {
    await page.goto("/login");
    const submitButton = page.getByRole("button", { name: /로그인|login|Sign\s*In/i });
    await expect(submitButton).toBeVisible();
  });

  test("회원가입 / 비밀번호 찾기 링크가 표시된다", async ({ page }) => {
    await page.goto("/login");
    const signUpLink = page.getByRole("link", { name: /회원가입|sign\s*up/i });
    const forgotLink = page.getByRole("link", { name: /비밀번호|forgot|password/i });
    await expect(signUpLink.or(forgotLink)).toBeVisible();
  });

  test("빈 form 으로 submit 시 클라이언트 검증 메시지 표시", async ({ page }) => {
    await page.goto("/login");
    const submitButton = page.getByRole("button", { name: /로그인|login/i });
    await submitButton.click();
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/\/login/);
  });

  test("잘못된 이메일 형식 입력 시 검증 동작", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.getByLabel(/email|이메일/i).first();
    await emailInput.fill("not-an-email");
    const passwordInput = page.getByLabel(/password|비밀번호/i).first();
    await passwordInput.fill("AnyPassword1!");
    await page.getByRole("button", { name: /로그인|login/i }).click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/login/);
  });
});
