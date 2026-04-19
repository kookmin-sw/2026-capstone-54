# TODO: subscriptions 앱 구현

## 설계 결정 사항

### 무료 요금제 처리 방식
- **사용자 생성 시 자동으로 free subscription 생성** (Django post_save 시그널)
- 무료 구독은 `expires_at=NULL`, `status=active`로 항상 유효
- 유료 구독이 활성 중인 경우 유료 구독을 우선 반환 (plan_type별 우선순위)
- 유료 구독 만료/취소 시 free 구독이 자동으로 현재 구독이 됨

### 동시 구독 제한
- 유료(non-free) 구독은 동시에 하나만 활성 가능
- free 구독은 항상 별도로 존재하며 유료 구독 여부와 무관
- 어드민이 유료 구독 생성 시 기간 겹침(overlap) 검증

### 일일 티켓 지급 정책
- `SubscriptionPlanTicketPolicy` 모델: 플랜별 · feature_key별 일일 지급량 설정
- 한국 시간 00:00 (UTC 15:00)에 Celery Beat으로 스케줄 실행
- `GrantDailySubscriptionTicketsService` → 각 사용자에게 `GrantTicketsService` 호출

### API
- `GET /api/v1/subscriptions/me/` — 현재 사용자의 활성 구독 반환
- 인증 필요 (IsEmailVerified)
- 어드민에서만 구독 생성/취소 가능 (결제 로직 미구현)

---

## TODO 목록

- [x] `subscriptions/enums/plan_type.py` — PlanType.FREE, PlanType.PRO
- [x] `subscriptions/enums/subscription_status.py` — ACTIVE, CANCELLED, EXPIRED
- [x] `subscriptions/models/subscription.py` — 구독 정보 모델
- [x] `subscriptions/models/subscription_plan_ticket_policy.py` — 플랜별 일일 티켓 정책 모델
- [x] `subscriptions/services/create_free_subscription_service.py` — 사용자 생성 시 free 구독 자동 생성
- [x] `subscriptions/services/get_current_subscription_service.py` — 현재 활성 구독 조회
- [x] `subscriptions/services/grant_daily_subscription_tickets_service.py` — 전체 사용자 일일 티켓 지급
- [x] `subscriptions/tasks/grant_daily_subscription_tickets_task.py` — Celery Beat 스케줄 태스크
- [x] `subscriptions/signals/` — 사용자 생성 시 free 구독 생성 시그널
- [x] `subscriptions/admin/subscription_admin.py` — 어드민에서 구독 생성/취소
- [x] `subscriptions/admin/subscription_plan_ticket_policy_admin.py` — 정책 관리
- [x] `subscriptions/factories/` — 테스트용 팩토리
- [x] `subscriptions/migrations/0001_initial.py` — 마이그레이션
- [x] `api/v1/subscriptions/serializers/subscription_serializer.py`
- [x] `api/v1/subscriptions/views/subscription_me_view.py`
- [x] `api/v1/subscriptions/urls.py`
- [x] `api/v1/subscriptions/tests/views/test_subscription_me_view.py`
- [x] `config/settings/components/installed_app.py` — PROJECT_APPS에 추가
- [x] `api/v1/urls.py` — subscriptions URL 등록
- [x] `config/settings/components/celery_beat.py` — 일일 티켓 태스크 스케줄 등록

---

## 미구현 항목 (추후 결제 로직 연동 시)

- [ ] 결제 완료 후 구독 자동 생성 서비스 (현재는 어드민만 가능)
- [ ] 구독 만료 처리 태스크 (expires_at 지난 항목 status=expired 처리)
- [ ] 구독 갱신 로직
- [ ] 결제 실패 처리
