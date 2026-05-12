# Sequence — 회원가입 → 이메일 인증 → JWT → 프로필 완성

| 항목 | 내용 |
|---|---|
| **종류** | Sequence Diagram |
| **PUML** | [`sequence-auth-signup.puml`](./sequence-auth-signup.puml) |
| **이미지** | [`../out/sequence_diagrams/sequence-auth-signup.png`](../out/sequence_diagrams/sequence-auth-signup.png) |

## 목적

사용자가 가입 → 이메일 인증 → 로그인 → 프로필 완성까지의 **풀스크린 가드 흐름** 을 시퀀스로 상세 표현합니다.

## 참여자 (Participants)

- **Frontend** (SignUpPage / VerifyEmailPage / OnboardingPage)
- **Backend** (SignUpAPIView / VerifyEmailAPIView / OnboardingAPIView)
- **Celery** (SendVerificationEmailTask / SendWelcomeEmailTask)
- **SMTP** (이메일 발송)
- **Redis** (Celery broker)

## 핵심 시퀀스

1. **가입**: `POST /api/v1/users/sign-up/` → SignUpService 가 User 생성 + 초기 티켓 발급 + Celery 메일 발송 트리거 → JWT (access + refresh cookie) 응답
2. **이메일 인증 코드 수신**: SendVerificationEmailTask → SMTP → 사용자 메일함 (6 자리 코드)
3. **인증 코드 입력**: `POST /api/v1/users/verify-email/` → `EmailVerificationCode.objects.active()` 검증 → User.email_confirmed_at 설정
4. **온보딩**: `POST /api/v1/users/onboarding/` → 직무 카테고리 + 경력 단계 저장 → User.profile_completed_at 설정
5. **풀스크린 가드 해제**: 이메일 인증 + 프로필 완성 → `/home` 라우팅

## 핵심 트랜잭션 / 비동기

- `transaction.on_commit` — 가입 트랜잭션 commit 후에만 이메일 발송 (롤백 시 미발송)
- 격리된 발급: 가입 자체와 티켓 발급 / 이메일 발송 분리

## 관련 코드 / FR

- [FR-AUTH-01~10](../../report-drafts/fr/auth/) — 인증 / 온보딩 FR
- [ADR-012](../../report-drafts/decisions/012-jwt-vs-session.md) — JWT 선택
- 코드: `backend/webapp/users/services/sign_up_service.py`

## 활용 시점

- 보고서 §2.2.1 연구/개발 내용 — 인증 도메인 흐름
- 발표 자료 — 사용자 첫 경험
