# Backend TODO — Streaks Feature

> 스트릭(연속 참여) 시스템, 티켓 보상, 업적 달성 기능 전체 구현 계획

---

## 설계 개요

### 핵심 개념

| 개념 | 설명 |
|------|------|
| **StreakStatistics** | 사용자별 현재 연속 일수·최장 기록을 캐싱하는 집계 테이블 |
| **StreakLog** | 날짜별 면접 참여 횟수를 기록 (달력 뷰 데이터 소스) |
| **DailyInterviewRewardPolicy** | 하루 1~5회 면접 순서별 지급 티켓 수 정책 |
| **StreakMilestonePolicy** | 특정 연속 일수 달성 시 지급할 티켓 수 정책 (7일, 14일, 30일…) |
| **StreakMilestoneAchievement** | 사용자가 달성한 마일스톤 이력 (중복 지급 방지) |
| **UserTicket** | 사용자가 보유한 티켓 수 (feature_key별 구분) |
| **TicketItem** | 티켓으로 구매할 수 있는 아이템 (name만 선구현) |

### 보상 흐름

```
면접 완료
  └─ RecordInterviewParticipationService
       ├─ StreakLog 업데이트 (interview_count++)
       ├─ StreakStatistics 업데이트
       │    ├─ 오늘 첫 면접이면 current_streak++, last_participated_date 갱신
       │    └─ current_streak > longest_streak 이면 longest_streak 갱신
       ├─ 일일 인터뷰 티켓 지급 (DailyInterviewRewardPolicy)
       │    ├─ 1회: base_tickets (예: 3)
       │    ├─ 2회: 2
       │    ├─ 3~5회: 1
       │    └─ 6회 이상: 0 (하루 최대 5회까지만 지급)
       └─ 마일스톤 달성 확인 (StreakMilestonePolicy)
            └─ 미달성 마일스톤 달성 시 → GrantTicketsService + StreakMilestoneAchievement 기록

매일 자정 (Celery Beat)
  └─ ExpireStreaksService
       └─ last_participated_date < 어제인 사용자 current_streak = 0
```

### API

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/v1/streaks/me/?year=2025&month=3` | 내 스트릭 통계 + 해당 월 참여 날짜 목록 |

---

## TODO 목록

### Phase 1 — 모델

- [x] `streaks` Django 앱 생성
- [x] `StreakStatistics` 모델 (1:1 User, current_streak, longest_streak, last_participated_date)
- [x] `StreakLog` 모델 (User + log_date, interview_count, `# interview_result_ids` 주석)
- [x] `DailyInterviewRewardPolicy` 모델 (interview_order 1~5, ticket_reward, is_active)
- [x] `StreakMilestonePolicy` 모델 (milestone_days, ticket_reward, is_active)
- [x] `StreakMilestoneAchievement` 모델 (User + StreakMilestonePolicy, unique_together)
- [x] `UserTicket` 모델 (User + feature_key, count, unique_together)
- [x] `TicketItem` 모델 (name, `# price/description/item_type` 주석)
- [x] INSTALLED_APPS에 `streaks` 추가

### Phase 2 — 서비스

- [x] `RecordInterviewParticipationService` — 면접 완료 시 호출 (스트릭 적립 + 티켓 지급)
- [x] `ExpireStreaksService` — 매일 자정 current_streak 만료 처리
- [x] `GrantTicketsService` — 재사용 가능한 티켓 지급 서비스

### Phase 3 — API

- [x] `GET /api/v1/streaks/me/` — 스트릭 통계 + 월별 로그 조회
  - Query params: `year` (default: 현재 연도), `month` (default: 현재 월)
  - Response: current_streak, longest_streak, last_participated_date, log_dates[]

### Phase 4 — 팩토리 / 어드민 / 마이그레이션

- [x] FactoryBoy 팩토리 (전 모델)
- [x] Unfold Admin 등록 (전 모델)
- [x] `makemigrations` + `migrate`

### Phase 5 — 테스트

- [x] 모델 테스트 (StreakStatistics, StreakLog, UserTicket, StreakMilestoneAchievement)
- [x] 서비스 테스트 (RecordInterviewParticipationService, ExpireStreaksService)
- [x] API 테스트 (GET /api/v1/streaks/me/)

---

## 미래 구현 사항 (TODO Later)

- [ ] `StreakLog.interview_result_ids` — ArrayField(BigIntegerField), 면접 결과 ID 목록
- [ ] `TicketItem.price` — 아이템 구매에 필요한 티켓 수
- [ ] `TicketItem.description` — 아이템 설명
- [ ] `TicketItem.item_type` — 아이템 유형 (예: `subscription_extension`, `feature_unlock`)
- [ ] `UserTicket` → `TicketItem` 구매 서비스 (`PurchaseItemService`)
- [ ] 스트릭 만료 시 사용자 알림 (Celery 태스크)
- [ ] Celery Beat 스케줄 등록 (`ExpireStreaksService` 자동 실행)
- [ ] `interview_sessions` 완료 이벤트 → `RecordInterviewParticipationService` 연동
- [ ] 관리자 페이지에서 `DailyInterviewRewardPolicy` 초기 데이터 시드
- [ ] 관리자 페이지에서 `StreakMilestonePolicy` 초기 데이터 시드 (7일, 14일, 30일, 60일)
