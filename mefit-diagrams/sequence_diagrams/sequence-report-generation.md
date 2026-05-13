# Sequence — 분석 리포트 생성 파이프라인 (5+ 단계 zoom-in)

| 항목 | 내용 |
|---|---|
| **종류** | Sequence Diagram |
| **PUML** | [`sequence-report-generation.puml`](./sequence-report-generation.puml) |
| **이미지** | [`../out/sequence_diagrams/sequence-report-generation.png`](../out/sequence_diagrams/sequence-report-generation.png) |

## 목적

**interview-analysis-report Worker** 의 5 단계 파이프라인을 상세 zoom-in. Load → Voice (Lambda fork-join) → Context → LLM → Save 의 각 단계 + SSE 진행 상태 통보.

## 참여자

- **Frontend** (분석 리포트 진행 화면)
- **Backend** (GenerateAnalysisReportService)
- **interview-analysis-report Worker** (ReportGenerator)
- **voice-analyzer Lambda** (음성 메트릭)
- **face-analyzer 결과** (RDS에서 read)
- **OpenAI gpt-4o** (5 카테고리 평가)
- **SSE Consumer** (`ReportStatusConsumer`)
- **PostgreSQL**

## 5 단계 파이프라인 상세

### Step 1: Load

- `InterviewAnalysisReport` 로드 + Session + Turns prefetch
- Resume + UserJobDescription 로드
- 소요: < 1초

### Step 2: Voice Analysis (fork-join)

- 각 turn 의 `audio_key` → voice-analyzer Lambda 병렬 invoke
- ThreadPoolExecutor max_workers=8
- 결과: turn 별 (속도 / 필러 / 침묵 / 음량)
- 소요: 5~15초 (8 turn 기준)

### Step 3: Context Building

- 이력서 요약 + JD 요약 + 음성 metric + 표정 분류 (face-analyzer 결과) 통합
- LLM 입력 context 구성
- 소요: < 2초

### Step 4: LLM Analyze

- gpt-4o + `with_structured_output(AnalysisResult)`
- 5 카테고리 점수 + 종합 점수 + 등급 + 질문별 피드백
- TokenUsageCallback — 비용 자동 기록
- 소요: 30~70초

### Step 5: Save

- `InterviewAnalysisReport` + `InterviewAnalysisCategoryScore` × 5 + `InterviewAnalysisTurnFeedback` × N
- 트랜잭션 atomic
- 소요: < 2초

## SSE 진행 통보

각 단계 변경 시 `Report.current_step` 갱신 → 1.5초 polling Consumer → 클라이언트 progress UI.

## 관련 코드 / FR

- [FR-REPORT-01~11](../../report-drafts/fr/report/) — 분석 리포트 FR
- [FR-REPORT-02](../../report-drafts/fr/report/FR-REPORT-02.md) — 5 단계 파이프라인
- 코드: [`interview-analysis-report/services/report_generator.py`](../../interview-analysis-report/services/report_generator.py)
