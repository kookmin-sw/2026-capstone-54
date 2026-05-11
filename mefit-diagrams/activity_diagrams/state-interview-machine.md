# 면접 세션 상태 머신 — useReducer + Zustand 직교 머신 설계 문서

> **대상 코드**: `frontend/src/pages/interview-session/` + `frontend/src/features/interview-session/`
> **관련 다이어그램**: [state-interview-machine.puml](state-interview-machine.puml), [state-interview-pause-resume.puml](state-interview-pause-resume.puml)

---

## 1. 개요 — 왜 2개의 머신인가

미핏의 면접 세션 화면([InterviewSessionPage.tsx](../../frontend/src/pages/interview-session/ui/InterviewSessionPage.tsx))은 **두 개의 직교(orthogonal) 상태 머신**으로 구성된다.

| 머신 | 위치 | 책임 | 상태 수 |
|---|---|---|---|
| **A. 인터뷰 진행 머신** | `useReducer` ([machine.ts](../../frontend/src/pages/interview-session/model/machine.ts)) | Q&A 흐름 / TTS / STT / 녹화 / 답변 제출 | 11 + 1 choice |
| **B. 일시중지 머신** | Zustand `isPaused` 플래그 ([store.ts](../../frontend/src/features/interview-session/model/store.ts)) | 사용자/탭 가용성에 따른 일시 정지 + UI overlay | 2 (active / paused) |

**왜 합치지 않았는가?**
- "paused" 를 Machine A 의 11번째 상태로 만들면 → 11개 상태 × paused 분기 → **상태 폭발(state explosion)**
- Pause 는 인터뷰 진행과 **독립적인 차원** — `speaking` 중에도 paused 가능, `submitting` 중에도 paused 가능
- 녹화(MediaRecorder)는 pause 사이클과 **별개의 단일 라이프사이클** (start → stop, 중간 pause 없음)

이 직교 설계의 핵심 invariant:
> **★ 녹화는 paused 머신과 동기로 일시중지/재개되며, 같은 MediaRecorder instance 에서 이어서 녹화되어 영상 연속성을 유지한다 ★**

> *(이전 버전의 invariant "녹화는 paused 동안에도 계속 진행" 은 잘못된 구현이었으며, 본 문서는 수정된 설계를 반영합니다.)*

---

## 2. Machine A — 인터뷰 진행 머신 (useReducer)

### 2.1 상태 (MachinePhase)

| 상태 | 의미 | 진입 조건 | Entry effects ([useInterviewMachine.ts](../../frontend/src/pages/interview-session/hooks/useInterviewMachine.ts)) |
|---|---|---|---|
| `idle` | 초기, 미디어 + 세션 대기 | (초기) | — |
| `ready` | Start 버튼 활성 | `MEDIA_READY` | — |
| `starting` | startInterview API in-flight | `START` | — |
| `tts_playing` | 질문 TTS 재생 + 아바타 발화 | `QUESTION_ARRIVED` 또는 **`RESUME`** | `resetText()`, `avatarSpeak(q)`, `playTtsText(q)`, `prepareRecording(turnId)` |
| `preparing_record` | TTS 종료 후 녹화 준비 완료 대기 | `TTS_DONE` | (`prepareRecording()` Promise resolve 대기) |
| `mode_choice` <<choice>> | 분기 pseudo-state | `RECORDING_READY` | `[isRealMode]` → `countdown` else → `awaiting_start` |
| `countdown` | REAL 모드 자동 시작 카운트다운 (5~30초) | `mode_choice [isRealMode]` | `setTimeout(1000)` 루프 |
| `awaiting_start` | PRACTICE 모드 "말하기 시작" 대기 | `mode_choice [!isRealMode]` | — |
| `speaking` | STT + 녹화 + 시선/고개 카운팅 | `COUNTDOWN_TICK [next<=0]` 또는 `PRACTICE_START` | `startStt()`, `startTurnCounting()`, `startRecording(turnId)` |
| `submitting` | 답변 제출 + 백엔드 처리 | `SUBMIT` | `stopStt()`, `stopTurnCounting()`, `stopRecording()`, `submitInterviewAnswer(...)` |
| `finished` <<terminal>> | 면접 완료 | `FINISH` | cleanup all + `navigate("/interview/results")` |
| `error` <<errstate>> | 복구 불가 에러 | `ERROR` | (복구 불가) |

### 2.2 이벤트 (MachineEvent)

| 이벤트 | Payload | 의미 |
|---|---|---|
| `MEDIA_READY` | — | 카메라/마이크 권한 + 디바이스 준비 완료 |
| **`RESUME`** | `{ turnId, question }` | ★ 끊긴 세션 복구 ★ — `idle → tts_playing` 직행 |
| `START` | — | 사용자 "면접 시작" 클릭 |
| `QUESTION_ARRIVED` | `{ turnId, question }` | `startInterview` API 응답 수신 |
| `TTS_DONE` | — | TTS 재생 완료 |
| `RECORDING_READY` | — | `prepareRecording()` Promise resolve |
| `COUNTDOWN_TICK` | `{ next: number }` | 1초마다 발행 |
| `PRACTICE_START` | — | practice 모드 "말하기 시작" 클릭 |
| `SUBMIT` | — | "답변 완료" 클릭 |
| `ANSWER_ACCEPTED` | `{ nextTurnId, nextQuestion }` | submit-answer 응답 |
| `FINISH` | — | 더 이상 질문 없음 |
| `ERROR` | `{ message }` | 복구 불가 에러 |
| `SET_REAL_MODE` | `{ isRealMode }` | 모드 flag 갱신 (상태 전이 없음) |

### 2.3 종료 조건

- `finished`: 사용자 "면접 종료" 클릭 OR 마지막 답변 제출 후 자동 (`FINISH` 이벤트)
- `error`: 마이크 권한 거부, WebSocket close code `4409 EVICTED` (다른 탭에서 인터뷰 시작 시 takeover), 복구 불가 network failure

---

## 3. Machine B — 일시중지 머신 (Zustand store, orthogonal)

### 3.1 상태

| 상태 | 의미 | UI 효과 |
|---|---|---|
| `active` | 정상 진행 (`isPaused = false`) | PausedOverlay 숨김 |
| `paused` | 일시 중지 (`isPaused = true`) | PausedOverlay 표시 (reason 별 메시지) |

### 3.2 Pause 트리거 (모두 자동, 즉시 발동)

| 트리거 | reason 값 | 감지 위치 |
|---|---|---|
| Tab visibility hidden | `"user_left_window"` | [usePageVisibility.ts](../../frontend/src/features/interview-session/lib/usePageVisibility.ts) `document.visibilitychange` |
| **Window blur (★ 신규)** | `"user_left_window"` | [usePageVisibility.ts](../../frontend/src/features/interview-session/lib/usePageVisibility.ts) `window.blur` — 다른 앱/창 전환, 분할 창, devtools open 도 감지 |
| pagehide (BFCache) | (자동 false) | [usePageVisibility.ts](../../frontend/src/features/interview-session/lib/usePageVisibility.ts) `window.pagehide` |
| 60초 idle 감지 | `"user_idle"` | [InterviewSessionPage.tsx](../../frontend/src/pages/interview-session/ui/InterviewSessionPage.tsx) `useIdleDetector` |
| 사용자 수동 클릭 | `"manual_pause"` | (UI 버튼) |
| Server-initiated | (그대로 사용) | 서버가 `pause_ack` 푸시 (예: heartbeat 누락) |

### 3.3 Resume 트리거 (★ 모두 명시적 사용자 액션 — auto-resume 제거)

| 트리거 | 위치 | 동작 |
|---|---|---|
| **PausedOverlay "이어서 하기" 버튼 클릭** | [PausedOverlay.tsx](../../frontend/src/widgets/interview-session/PausedOverlay.tsx) | `onResume()` (= `wsClientRef.current?.sendResume()`) + `setPaused(false, null)` (낙관적 UI) |
| **IdleDetectedModal "계속하기" 버튼 클릭** | [InterviewSessionPage.tsx](../../frontend/src/pages/interview-session/ui/InterviewSessionPage.tsx) `handleIdleContinue` | `resetIdle()` + `wsClientRef.current?.sendResume()` |
| Server resume_ack | 백엔드 `ResumeInterviewSessionService` 응답 | `setPaused(false, null)` (backend confirmed) |

> **변경 사항**: 이전에는 `visible=true` (탭 복귀) 또는 `isIdle=false` (활동 감지) 시 자동으로 `sendResume()` + `setPaused(false)` 호출되었으나, 이는 사용자가 의도하지 않은 시점에 면접 재개되는 문제를 만들 수 있어 제거됨. **모든 resume 은 사용자의 명시적 버튼 클릭으로만 발동.**

### 3.4 Pause/Resume 사이드 이펙트

| 동작 | Pause 시 | Resume 시 |
|---|---|---|
| **TTS** | `skipTts()` (재생 중단) | (다음 turn 에서 자동 재시작) |
| **STT** | (별도 정지 없음 — SUBMIT 시점에 stop) | — |
| **영상 분석** | `stopVideoAnalysis()` | (다음 turn 에서 재시작) |
| **녹화 (MediaRecorder)** | ★ **`MediaRecorder.pause()`** ★ — 청크 생성 중단, 같은 instance 유지 | ★ **`MediaRecorder.resume()`** ★ — 같은 instance 에서 이어서 녹화 |
| **Backend recording API** | `InitiateRecording` / `PresignPart` / `CompleteRecording` 모두 PAUSED 거부 | (resume 후 다시 허용) |
| **WebSocket** | `sendPause(reason)` | `sendResume()` |
| **API call (네트워크)** | 중단 안 됨 (`submitting` 중이면 그대로 완료) | — |

---

## 4. 녹화 동기 일시중지/재개 — MediaRecorder.pause() / resume()

**라이프사이클**: `prepareRecording → startRecording → (... MediaRecorder.pause() / resume() 사이클 가능 ...) → stopRecording`

같은 `MediaRecorder` instance 를 통해 pause/resume 가 이뤄지며, 영상 파일은 paused 동안의 시간을 건너뛰고 자연스럽게 연결된다 (브라우저 MediaRecorder spec 보장).

**이 동작이 의도된 이유**:
1. **사용자 의도 일치** — paused 는 "면접을 잠시 멈춤" 으로, 사용자가 자리를 비운 동안의 영상은 분석 가치가 없음
2. **개인정보 보호** — paused (특히 `user_left_window`) 중 부주의한 환경이 캡처되지 않도록
3. **분석 정확도** — paused 구간을 답변에 포함시키면 음성/표정 분석 결과 왜곡 (silence ratio / no_face 가 과도 계산됨)
4. **저장 비용** — paused 시간이 길어질 경우 S3 청크 비용 절감

**녹화 라이프사이클 도식**:

```
prepareRecording(turnId)    ← initiate API (recording 세션 시작)
        ↓
startRecording(turnId)      ← MediaRecorder.start() + 청크 업로더 가동
        ↓
   .──────────────────────────.
  │  pauseRecording             │ ← MediaRecorder.pause()  : 청크 생성 중단
  │   (Zustand isPaused          │   • 같은 MediaRecorder instance 유지
  │     ↔ useEffect 동기화)      │   • 마지막 버퍼 한 번 더 emit (정상 동작)
  │                             │
  │  resumeRecording            │ ← MediaRecorder.resume() : 청크 생성 재개
  │                             │
  │  (반복 가능 — 사이클 N 번)   │
   '──────────────────────────'
        ↓
stopRecording()             ← MediaRecorder.stop() + complete API
```

**Backend 정합성 (defense-in-depth)** — `InterviewSession.interview_session_status == PAUSED` 인 동안 모든 mutate API 가 거부됨 (모두 `ValidationException` HTTP 400 통일):

| Endpoint | Exception | View 파일 |
|---|---|---|
| `POST /interviews/{uuid}/recordings/initiate/` | `ValidationException` (400) | [initiate_recording_view.py](../../backend/webapp/api/v1/interviews/views/initiate_recording_view.py) |
| `GET /recordings/{uuid}/presign-part/` | `ValidationException` (400) | [presign_part_view.py](../../backend/webapp/api/v1/interviews/views/presign_part_view.py) |
| `POST /recordings/{uuid}/complete/` | `ValidationException` (400) | [complete_recording_view.py](../../backend/webapp/api/v1/interviews/views/complete_recording_view.py) |
| `POST /recordings/{uuid}/abort/` | `ValidationException` (400) | [abort_recording_view.py](../../backend/webapp/api/v1/interviews/views/abort_recording_view.py) |
| `POST /interviews/{uuid}/turns/{pk}/submit-answer/` | `ValidationException` (400) | submit_answer_view.py |

따라서 frontend 의 MediaRecorder pause + backend 의 API 가드가 이중으로 보장한다 (defense-in-depth). Frontend 가 버그로 paused 동안 청크 emit 시도 → backend 가 400 으로 거부 → frontend 가 로깅 후 무시.

E2E 검증: [test_interview_lifecycle_e2e.py](../../backend/webapp/api/v1/interviews/tests/views/test_interview_lifecycle_e2e.py) 의 `S10_PausedSessionGuardTests` 클래스 (initiate / complete / abort / submit_answer 4 종 — **presign_part 는 누락 → 추가 필요**).

**Resume race condition** — visibility 가 빠르게 hidden → visible 토글될 때, frontend 는 즉시 `setPaused(false)` 하지만 backend 는 ack 처리에 ~100-200ms 가 걸린다. 이 구간에 `MediaRecorder.resume()` 으로 emit 된 첫 청크의 PresignPart 요청이 backend 의 PAUSED 가드에 막혀 409 가 반환될 수 있다. 단일 청크가 누락되더라도 녹화 전체에는 영향 없으며, 향후 chunk 업로더 retry 로직으로 보완 가능.

---

## 5. 두 머신의 직교성 (Orthogonality) — 상태 공간

전체 상태 공간 = (Machine A: 11) × (Machine B: 2) = **22 cross product**

UI/녹화 동작 매트릭스 (대표):

| Machine A | Machine B | 사용자 인지 동작 | MediaRecorder 상태 |
|---|---|---|---|
| `speaking` | `active` | 정상 답변 (STT + 녹화 + 분석 모두 활성) | `recording` |
| `speaking` | `paused` | PausedOverlay 표시, STT 정지 | ★ `paused` ★ (청크 생성 중단) |
| `tts_playing` | `active` | TTS 재생, 녹화 준비 | `recording` (이전 turn 종료 안 됐다면) |
| `tts_playing` | `paused` | TTS skip, 화면 dim | ★ `paused` ★ |
| `submitting` | `paused` | API 제출 진행, overlay 표시 | `inactive` (이미 stop 됐음) |
| `countdown` | `paused` | 카운트다운 정지, overlay 표시 | `inactive` (아직 start 안 됨) |
| `finished` | (any) | 종료 — paused 의미 없음 | `inactive` |
| `error` | (any) | 에러 — paused 무시 | (이전 상태에 따라) |

**설계 장점**:
- ✅ 상태 폭발 방지 (paused × 11 = 22개 상태 만들 필요 없음)
- ✅ Pause 가 어떤 진행 상태에서도 작동 (universal 가용)
- ✅ 녹화 연속성 자연스러움 (recording 은 단일 lifecycle)
- ✅ UI 분리 — PausedOverlay 는 다른 컴포넌트와 무관하게 표시

---

## 6. WebSocket 메시지 흐름

연결: `/ws/interviews/{uuid}/?ticket=<ticket>` ([backend/webapp/api/v1/interviews/consumers.py](../../backend/webapp/api/v1/interviews/consumers.py))

| 방향 | 메시지 | 트리거 | 백엔드 처리 |
|---|---|---|---|
| FE → BE | `{ type: "pause", reason }` | `sendPause()` 호출 | `PauseInterviewSessionService.execute()` → `pause_ack` 응답 |
| FE → BE | `{ type: "resume" }` | `sendResume()` 호출 | `ResumeInterviewSessionService.execute()` → `resume_ack` 응답 |
| FE → BE | `{ type: "heartbeat", ts }` | 30초 간격 | `RecordInterviewHeartbeatService.execute()` |
| BE → FE | `{ type: "pause_ack", reason? }` | 위의 응답 | FE: `setPaused(true, reason)` |
| BE → FE | `{ type: "resume_ack" }` | 위의 응답 | FE: `setPaused(false, null)` |
| BE → FE | close code `4409` (EVICTED) | 동일 사용자 다른 탭에서 인터뷰 시작 | FE: Takeover 모달 표시 |

**중요**: 답변 제출은 **REST API** 사용 (`POST /api/v1/interviews/{uuid}/turns/{pk}/submit-answer/`) — WebSocket 으로 답변을 보내지 않음.

---

## 7. 변경 이력 (최근)

| 변경 | 영향 |
|---|---|
| `RESUME` 이벤트 추가 | `idle → tts_playing` 직행 가능 (끊긴 세션 복구) |
| `isPaused` / `pauseReason` Zustand store 도입 | 일시중지 머신 (B) 신설 |
| WS `pause` / `resume` / `pause_ack` / `resume_ack` 메시지 추가 | 백엔드 세션과 일시중지 상태 동기화 |
| `useIdleDetector` 도입 | 60초 idle → 자동 pause |
| `document.visibilitychange` 핸들러 추가 | Tab 비활성화 시 자동 pause |
| **★ `useMediaRecorder.pause()` / `.resume()` 메서드 추가** | `MediaRecorder.pause()` / `resume()` 호출로 청크 생성 동기화 |
| **★ `useRecordingManager.pauseRecording()` / `resumeRecording()` 노출** | Manager 레이어에서 wrapper 제공 |
| **★ `InterviewSessionPage` useEffect 추가** | `isPaused` 변경 시 자동으로 recording.pauseRecording/resumeRecording 호출 |
| **★ `PresignPartView` PAUSED 가드 추가** | InitiateRecording / CompleteRecording 과 일관된 backend 보호 (defense-in-depth) |
| **★ 잘못된 invariant 수정** | "녹화 paused 중에도 계속" → "MediaRecorder pause/resume 동기" (같은 instance, 영상 연속성) |

---

## 8. 관련 다이어그램 / 코드 레퍼런스

| 항목 | 경로 |
|---|---|
| **Machine A 시각화** | [state-interview-machine.puml](state-interview-machine.puml) |
| **Machine B 시각화** | [state-interview-pause-resume.puml](state-interview-pause-resume.puml) |
| 백엔드 InterviewSession 상태 | [state-interview-session.puml](state-interview-session.puml) |
| 백엔드 Recording 파이프라인 | [state-interview-recording.puml](state-interview-recording.puml) |
| 전체 면접 흐름 (Activity) | [activity-04-interview.puml](activity-04-interview.puml) |
| 전체 시퀀스 | [../sequence_diagrams/sequence-interview-full-flow.puml](../sequence_diagrams/sequence-interview-full-flow.puml) |
| 질문 생성 시퀀스 | [../sequence_diagrams/sequence-interview-question-generation.puml](../sequence_diagrams/sequence-interview-question-generation.puml) |
| 리포트 UI 컴포넌트 | [../component_diagrams/component-interview-report-ui.puml](../component_diagrams/component-interview-report-ui.puml) |

### 핵심 코드 파일

| 역할 | 경로 |
|---|---|
| Reducer 정의 | `frontend/src/pages/interview-session/model/machine.ts` |
| Reducer 사이드 이펙트 hook | `frontend/src/pages/interview-session/hooks/useInterviewMachine.ts` |
| Zustand store | `frontend/src/features/interview-session/model/store.ts` |
| Zustand types | `frontend/src/features/interview-session/model/types.ts` |
| WebSocket hook | `frontend/src/pages/interview-session/hooks/useSessionWs.ts` |
| WebSocket client | `frontend/src/features/interview-session/api/sessionWs.ts` |
| Recording manager (★ `pauseRecording`/`resumeRecording` 추가) | `frontend/src/features/interview-session/lib/useRecordingManager.ts` |
| MediaRecorder wrapper (★ `pause`/`resume` 추가) | `frontend/src/features/interview-session/lib/useMediaRecorder.ts` |
| PausedOverlay UI | `frontend/src/widgets/interview-session/PausedOverlay.tsx` |
| 메인 페이지 (★ isPaused useEffect 추가) | `frontend/src/pages/interview-session/ui/InterviewSessionPage.tsx` |
| Backend PauseInterviewSessionService | `backend/webapp/interviews/services/pause_interview_session_service.py` |
| Backend ResumeInterviewSessionService | `backend/webapp/interviews/services/resume_interview_session_service.py` |
| Backend InterviewSession.mark_paused / mark_resumed | `backend/webapp/interviews/models/interview_session.py` |
| Backend PresignPartView (★ PAUSED 가드 추가) | `backend/webapp/api/v1/interviews/views/presign_part_view.py` |
