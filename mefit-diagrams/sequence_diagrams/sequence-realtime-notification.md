# Sequence — 실시간 알림 (SSE + Redis Channel Layer + 다중 이벤트 소스)

| 항목 | 내용 |
|---|---|
| **종류** | Sequence Diagram |
| **PUML** | [`sequence-realtime-notification.puml`](./sequence-realtime-notification.puml) |
| **이미지** | [`../out/sequence_diagrams/sequence-realtime-notification.png`](../out/sequence_diagrams/sequence-realtime-notification.png) |

## 목적

다양한 도메인 이벤트 (분석 완료 / 업적 달성 / 스트릭 보상 / 시스템 등) 가 발생할 때 **인앱 알림 + WebSocket push + 이메일** 다중 채널로 전달되는 시퀀스.

## 참여자

- **이벤트 소스** — analysis-resume / interview-analysis-report / streak / achievement signals
- **NotificationDispatchService**
- **Notification 모델** (RDS)
- **Channels Layer** (Redis)
- **WebSocket** (`UserWebSocketConsumer` — `user_{uuid}` group)
- **Celery** (`SendEmailTask`)
- **SMTP**

## 핵심 시퀀스

1. **이벤트 발생** (예: 이력서 분석 완료) → Django signal (`post_save`)
2. **NotificationDispatchService.execute()**:
   - `Notification.objects.create(user, type, title, body, action_url)`
   - `transaction.on_commit`:
     - **WebSocket push**: `channel_layer.group_send(f"user_{user.uuid}", {...})`
     - **Email 발송**: Celery `SendEmailTask.delay(...)` (해당 시)
3. **클라이언트 (Frontend)**:
   - WebSocket 으로 즉시 수신 → 종 아이콘 unread count++ + 토스트
   - 또는 알림 목록 페이지 진입 시 `GET /api/v1/notifications/` 조회

## 이벤트 → 채널 매트릭스

| 이벤트 | 인앱 | WebSocket | 이메일 |
|---|:---:|:---:|:---:|
| 이력서 분석 완료 | ✅ | ✅ | ⚠️ (옵션) |
| 면접 종료 | ✅ | ✅ | ❌ |
| 분석 리포트 완료 | ✅ | ✅ | ✅ |
| 업적 달성 | ✅ | ✅ | ❌ |
| 스트릭 마일스톤 보상 | ✅ | ✅ | ❌ |
| 약관 변경 | ✅ | ❌ | ✅ |
| 이메일 인증 코드 | ❌ | ❌ | ✅ |

## 핵심 기술

- **Django signals** — 이벤트 발생 자동 트리거
- **Redis Channel Layer** — k3s 다중 Pod 에서 분산 메시지
- **`transaction.on_commit`** — 트랜잭션 commit 후에만 통보 (롤백 시 미발송)
- **사용자별 그룹** (`user_{uuid}`) — 본인에게만 push

## 관련 코드 / FR

- [FR-NOTI-01~05](../../report-drafts/fr/notification-terms/) — 알림 도메인 FR
- 코드: `backend/webapp/notifications/services/`, `backend/webapp/api/v1/notifications/consumers.py`
