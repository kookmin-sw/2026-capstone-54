# meFit - AI 면접 준비 플랫폼

React + TypeScript + Vite로 구축된 AI 기반 면접 준비 플랫폼입니다.  
이력서 분석, AI 면접 시뮬레이션, 행동 분석, 성취 시스템을 제공합니다.

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 19.2.0 + TypeScript |
| 빌드 도구 | Vite 7 |
| 스타일링 | Tailwind CSS 4.2 |
| 상태 관리 | Zustand 5 |
| 라우팅 | React Router DOM 7 |
| 애니메이션 | GSAP 3, Lottie, Three.js |
| 테스트 | Jest + Testing Library |
| 패키지 매니저 | Bun |
| 코드 품질 | ESLint, Husky, lint-staged |

## 프로젝트 구조 (FSD)

Feature-Sliced Design 아키텍처를 따릅니다:

```
src/
├── app/          # 앱 설정, 라우팅, 전역 스타일
├── pages/        # 페이지 컴포넌트
├── features/     # 비즈니스 기능 단위
├── entities/     # 비즈니스 엔티티 (session 등)
├── widgets/      # 복합 UI 블록
└── shared/       # 공유 UI, 유틸리티, API 클라이언트
```

### Pages

```
pages/
├── landing/            # 랜딩 페이지
├── login/              # 로그인
├── sign-up/            # 회원가입
├── forgot-password/    # 비밀번호 찾기
├── reset-password/     # 비밀번호 재설정
├── verify-email/       # 이메일 인증
├── onboarding/         # 온보딩
├── home/               # 대시보드 홈
├── resume-new/         # 이력서 등록
├── resume-list/        # 이력서 목록
├── resume-detail/      # 이력서 상세
├── jd-add/             # 채용공고 등록
├── jd-list/            # 채용공고 목록
├── jd-detail/          # 채용공고 상세
├── interview-setup/    # 면접 설정
├── interview-precheck/ # 면접 사전 점검
├── interview-session/  # 면접 진행
├── interview-report/   # 면접 리포트
├── interview-results/  # 면접 결과 목록
├── achievements/       # 성취 배지
├── streak/             # 연속 학습 스트릭
├── notifications/      # 알림
├── settings/           # 설정 (구독 포함)
├── subscription/       # 구독 (→ settings로 리다이렉트)
├── not-found/          # 404
└── server-error/       # 500
```

### Features

```
features/
├── auth/               # 인증 (로그인, 회원가입, 토큰 관리)
├── resume/             # 이력서 CRUD
├── jd/                 # 채용공고 관리
├── interview-setup/    # 면접 설정
├── interview-precheck/ # 면접 사전 점검
├── interview-session/  # 면접 세션 (AI 질문, 행동 분석)
├── achievements/       # 성취 시스템
├── home/               # 대시보드 데이터
├── milestones/         # 마일스톤
├── notifications/      # 알림 (WebSocket)
├── onboarding/         # 온보딩 플로우
├── settings/           # 사용자 설정
├── streak/             # 스트릭 추적
├── subscription/       # 구독 관리
└── user-job-description/ # 사용자 JD 연결
```

## 라우트

### 공개 라우트 (로그인 불필요)

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 페이지 |
| `/login` | 로그인 |
| `/sign-up` | 회원가입 |
| `/forgot-password` | 비밀번호 찾기 |
| `/reset-password` | 비밀번호 재설정 |

### 보호 라우트 (로그인 필요)

| 경로 | 설명 |
|------|------|
| `/verify-email` | 이메일 인증 |
| `/onboarding` | 온보딩 |
| `/home` | 대시보드 홈 |
| `/resume` | 이력서 목록 |
| `/resume/new` | 이력서 등록 |
| `/resume/:uuid` | 이력서 상세 |
| `/jd` | 채용공고 목록 |
| `/jd/add` | 채용공고 등록 |
| `/jd/:uuid` | 채용공고 상세 |
| `/interview/setup` | 면접 설정 |
| `/interview/precheck/:interviewSessionUuid` | 면접 사전 점검 |
| `/interview/session/:interviewSessionUuid` | 면접 진행 |
| `/interview/session/:interviewSessionUuid/report` | 면접 리포트 |
| `/interview/results` | 면접 결과 목록 |
| `/achievements` | 성취 배지 |
| `/streak` | 연속 학습 스트릭 |
| `/notifications` | 알림 |
| `/settings` | 설정 |

## 디자인 시스템

### 색상

| 용도 | 값 |
|------|----|
| 배경 | `#FFFFFF` |
| 주요 액센트 | `#0991B2` / `#06B6D4` |
| 배지 텍스트 | `#0991B2` |
| 배지 배경 | `#E6F7FA` |
| 버튼 배경 | `#0A0A0A` |
| 카드 배경 | `#F9FAFB` |
| 카드 보더 | `#E5E7EB` |

### 폰트

- **Inter** (weight: 900 / 800 / 700)

### 로고

- `me` + **`Fit`** — Fit 색상: `#0991B2`

## 개발 시작

```bash
# 의존성 설치
bun install

# 환경 변수 설정
cp .env.sample .env

# 개발 서버 실행
bun run dev

# 빌드
bun run build

# 빌드 미리보기
bun run preview

# 테스트
bun run test

# 테스트 커버리지
bun run test:coverage

# 린트
bun run lint
```

## 환경 변수

`.env.sample`을 참고하여 `.env` 파일을 생성하세요.

## 기타

- **React Compiler** 활성화 — 자동 메모이제이션 최적화 ([공식 문서](https://react.dev/learn/react-compiler))
- **Husky + lint-staged** — 커밋 전 자동 ESLint 실행
- **AWS Amplify** 배포 (`amplify.yml` 참고)
