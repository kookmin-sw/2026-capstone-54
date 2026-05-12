# Sequence — 한 면접 시나리오 (Setup → Session → Lambda → Report)

| 항목 | 내용 |
|---|---|
| **종류** | Sequence Diagram |
| **PUML** | [`sequence-interview-full-flow.puml`](./sequence-interview-full-flow.puml) |
| **이미지** | [`../out/sequence_diagrams/sequence-interview-full-flow.png`](../out/sequence_diagrams/sequence-interview-full-flow.png) |

## 목적

한 사용자의 전체 면접 여정 — 면접 설정 → Precheck → 세션 진행 → 영상 처리 → 분석 리포트 생성까지를 **단일 시퀀스 다이어그램** 으로 표현. 가장 종합적인 시퀀스.

## 참여자

- **Frontend** (InterviewSetup / Precheck / Session / Results / Report)
- **Backend** (Interview / Ticket / Recording / Report 서비스들)
- **Voice-API** (TTS)
- **WebSocket** (`InterviewSessionConsumer`)
- **S3** (영상 / 오디오)
- **SNS / SQS / Lambda** (5종 — converter / frame-extractor / audio-extractor / voice-analyzer / face-analyzer)
- **interview-analysis-report Worker** (5 단계 파이프라인)
- **OpenAI gpt-4o** (분석 LLM)

## 핵심 시퀀스 (단계 구분)

### Phase 1: Setup + Precheck

1. 사용자가 이력서 + JD + 모드 + 난이도 선택
2. Precheck 3 단계 — 카메라 / 네트워크 / TTS 테스트

### Phase 2: Session

3. 면접 시작 — 티켓 차감 + 첫 질문 LLM 생성
4. WebSocket 연결 + TTS 음성 출력 + MediaRecorder 시작
5. 답변 종료 후 S3 multipart 업로드 + submit-answer

### Phase 3: Lambda (영상 처리)

6. S3 ObjectCreated → SNS fan-out → SQS 4 종
7. video-converter / frame-extractor / audio-extractor / face-analyzer Lambda 처리
8. step-complete SQS → Celery → InterviewRecording 갱신

### Phase 4: Report (분석 리포트)

9. 사용자가 *"분석 리포트 생성"* 클릭 → 5 티켓 차감
10. interview-analysis-report Worker 5 단계 파이프라인:
    - Load → Voice (Lambda fork-join) → Context → LLM (gpt-4o) → Save
11. SSE 진행 상태 push → 결과 화면

## 활용 시점

- 보고서 §2.2.1 핵심 시나리오
- 발표 자료 — *"한 사용자의 여정"* 슬라이드
- 신규 합류자 시스템 이해

## 관련 문서

- [`sequence-interview-question-generation.md`](./sequence-interview-question-generation.md) — 질문 생성 zoom-in
- [`sequence-report-generation.md`](./sequence-report-generation.md) — 리포트 생성 zoom-in
- [FR-INT-01~23](../../report-drafts/fr/interview/) — 면접 FR
- [FR-REPORT-01~11](../../report-drafts/fr/report/) — 리포트 FR
