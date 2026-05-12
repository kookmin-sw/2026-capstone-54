# Sequence — 티켓 라이프사이클 (Grant / Use / Refund / Expire + 일일 리셋)

| 항목 | 내용 |
|---|---|
| **종류** | Sequence Diagram |
| **PUML** | [`sequence-tickets-lifecycle.puml`](./sequence-tickets-lifecycle.puml) |
| **이미지** | [`../out/sequence_diagrams/sequence-tickets-lifecycle.png`](../out/sequence_diagrams/sequence-tickets-lifecycle.png) |

## 목적

티켓 도메인의 전체 라이프사이클 — 발급 (Grant) / 사용 (Use) / 환불 (Refund) / 만료 (Expire) + 일일 자동 충전 — 을 시퀀스로 통합 표현.

## 참여자

- **Frontend** (잔량 표시 / 면접 시작 / 결제)
- **Backend** (UseTicketsService / RefundTicketsService / GrantTicketsService)
- **Celery Beat** (DailyChargeTask / ExpireTicketsTask)
- **PostgreSQL** (UserTicket / TicketLog / SubscriptionPlanTicketPolicy)

## 시나리오별 시퀀스

### 1. Grant — 가입 시 초기 발급

- `SignUpService` → `GrantInitialSubscriptionTicketsService`
- Policy lookup (Free / Pro × initial_grant) → 30 또는 100 티켓
- `UserTicket.balance += amount` + `TicketLog (source=initial_grant)`

### 2. Use — 면접 시작 / 리포트 생성

- `StartInterviewService` → Policy lookup → `UseTicketsService(amount=5 or 10)`
- `select_for_update` (race condition 방지)
- 잔량 부족 시 `InsufficientTicketsException` (HTTP 402)
- `UserTicket.balance -= amount` + `TicketLog (source=interview_start)`

### 3. Refund — 시스템 오류 / 취소

- 자동 트리거 (precheck 실패 / LLM 첫 질문 실패 등)
- `RefundTicketsService` — 중복 환불 방지 (metadata.session_uuid)
- `UserTicket.balance += amount` + `TicketLog (source=interview_canceled)`

### 4. Expire — 30일 미사용

- Celery Beat 매일 자정 → `ExpireTicketsScheduledTask`
- `TicketLog.objects.filter(type=GRANT, expires_at__lt=now, is_expired=False)`
- `UserTicket.balance -= min(amount, balance)` + `TicketLog (source=auto_expire)`

### 5. Daily Charge — 일일 자동 충전

- Celery Beat 매일 자정 → `DailyChargeTask`
- Free 10 / Pro 30 티켓 자동 발급 (`GrantTicketsService`)

## 동시성 제어

모든 잔량 변동은 `select_for_update` + `transaction.atomic` 으로 race condition 방지.

## 관련 코드 / FR

- [FR-TICKET-01~06](../../report-drafts/fr/subscription-ticket/) — 티켓 도메인 FR
- [ADR-011](../../report-drafts/decisions/011-ticket-system.md) — Ticket BM
- 코드: [`backend/webapp/tickets/services/`](../../backend/webapp/tickets/services/)
