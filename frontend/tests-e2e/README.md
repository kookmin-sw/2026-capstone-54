# E2E 테스트 (Playwright)

화면을 실제로 띄우고 페이지별 대표 시나리오를 검증하는 E2E 테스트 모음.
Optional — 단위/통합 테스트 (Jest) 와 별도로 필요할 때만 실행.

## 설치

```bash
# 1) Playwright dev dependency 추가
bun add -d @playwright/test

# 2) 브라우저 (chromium) 설치
bunx playwright install chromium
# 또는 모든 브라우저: bunx playwright install
```

## 사용 가능한 스크립트 (package.json 에 추가 필요)

```jsonc
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "PWDEBUG=1 playwright test"
  }
}
```

## 실행

### 로컬에서 화면 직접 띄우고 실행 (headed mode)

```bash
# preview 서버 자동 시작 + 브라우저 띄움
bun run test:e2e:headed

# UI mode (interactive — recommended for debugging)
bun run test:e2e:ui
```

### CI / headless

```bash
bun run test:e2e
```

### 특정 페이지만 실행

```bash
bun run test:e2e tests-e2e/landing.spec.ts
bun run test:e2e tests-e2e/login.spec.ts
```

### 환경변수로 base URL 변경

기본은 `http://localhost:4173` (vite preview 의 기본 포트).

```bash
E2E_BASE_URL=http://localhost:5173 bun run test:e2e   # vite dev 사용
E2E_PORT=3000 bun run test:e2e                         # 다른 포트
```

## 디렉토리 구조

```
tests-e2e/
├── README.md                  ← 본 문서
├── landing.spec.ts            ← 랜딩 페이지 (/)
├── login.spec.ts              ← 로그인 (/login)
├── sign-up.spec.ts            ← 회원가입 (/sign-up)
└── protected-routes.spec.ts   ← 인증 가드 + 404
```

## 페이지별 대표 시나리오 설계

각 페이지 spec 은 다음 시나리오 패턴을 따른다:

| Spec | 시나리오 |
|---|---|
| `landing.spec.ts` | (1) 페이지 로드 + 타이틀 (2) CTA 표시 (3) CTA 클릭 → 회원가입/로그인 이동 |
| `login.spec.ts` | (1) email/password input 표시 (2) 로그인 버튼 (3) 회원가입/비밀번호찾기 링크 (4) 빈 폼 submit 시 검증 (5) 잘못된 이메일 형식 검증 |
| `sign-up.spec.ts` | (1) 회원가입 폼 필드 (2) 회원가입 버튼 (3) 로그인 링크 (4) 약관 체크박스 |
| `protected-routes.spec.ts` | (1) `/home`, `/onboarding`, `/interview/setup` 등 보호 라우트 → / or /login 리다이렉트 (2) 공개 라우트는 그대로 (3) 404 fallback |

추가 시나리오를 작성할 때는 동일한 `test.describe` + `test(name, async ({ page }) => ...)` 패턴을 따르면 된다.

## 향후 확장

추가하면 좋을 페이지:
- `interview-setup.spec.ts` — JD/이력서 선택 wizard (auth 필요 → fixture 로 토큰 주입)
- `interview-session.spec.ts` — 인터뷰 세션 (mediaDevices mock 필요)
- `interview-report.spec.ts` — 분석 리포트 viewing + scrollspy 네비게이션
- `resume-list.spec.ts` / `jd-list.spec.ts` — 리스트 페이지 + 페이지네이션

인증 필요 페이지는 Playwright fixture (`auth.setup.ts`) 로 로그인 토큰을 미리 주입하는 방식 권장:

```typescript
// tests-e2e/fixtures/auth.setup.ts
import { test as setup } from "@playwright/test";

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', process.env.E2E_TEST_EMAIL!);
  await page.fill('input[name="password"]', process.env.E2E_TEST_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL("/home");
  await page.context().storageState({ path: ".auth/user.json" });
});
```

## CI 통합

`.github/workflows/test.yml` 의 `e2e` job 은 기본 비활성 (`if: false`).
@playwright/test 를 설치한 후 `if: false` 를 `if: true` 또는 PR label 게이트로 변경.

## 트러블슈팅

| 증상 | 해결 |
|---|---|
| `Error: browserType.launch: Executable doesn't exist` | `bunx playwright install chromium` |
| `webServer exited with code 1` | preview 서버 빌드 실패 — `bun run build` 먼저 실행 |
| `Timeout 30000ms exceeded` | 페이지 로드 느림 — `E2E_BASE_URL` 환경변수로 dev 서버 직접 가리키기 |
| 401 / API 에러 | mock API 또는 storage state fixture 필요 |
