# Sequence — 면접 질문 생성 (FOLLOWUP vs FULL_PROCESS 분기)

| 항목 | 내용 |
|---|---|
| **종류** | Sequence Diagram |
| **PUML** | [`sequence-interview-question-generation.puml`](./sequence-interview-question-generation.puml) |
| **이미지** | [`../out/sequence_diagrams/sequence-interview-question-generation.png`](../out/sequence_diagrams/sequence-interview-question-generation.png) |

## 목적

면접 모드별 (FOLLOWUP / FULL_PROCESS) 질문 생성 로직을 시퀀스로 표현. LLM 호출 + 이력서 + 채용공고 컨텍스트 통합 + Pydantic 강제 응답 + TokenUsage 기록 포함.

## 참여자

- **Backend** (StartInterviewService / SubmitAnswerService)
- **Resume / JD models** (컨텍스트 소스)
- **OpenAI gpt-4o-mini** (질문 생성)
- **LangChain** (`ChatOpenAI` + `with_structured_output`)
- **TokenUsageCallback** (비용 기록)

## 핵심 시퀀스

### FOLLOWUP 모드 (꼬리질문)

1. 첫 질문: 이력서 요약 + JD 요구사항 → 첫 질문 1 개 LLM 생성
2. 사용자 답변 제출 → `SubmitAnswerAndGenerateFollowupService`
3. 직전 Q + A + 컨텍스트 → 후속 질문 LLM 생성 (총 5 turn)
4. 5 turn 도달 시 종료

### FULL_PROCESS 모드 (전체 프로세스)

1. 면접 시작 시 사전 구성 8~10 질문 전체 생성 (LLM 1회 호출)
2. 사용자 답변 제출 → 다음 사전 질문 반환 (LLM 호출 없음)
3. 모든 질문 완료 시 종료

## 비용 / 시간 차이

| 모드 | LLM 호출 수 | 비용 (대략) | 응답 지연 |
|---|---:|---:|---|
| FOLLOWUP | 6회 (첫 + 5 후속) | ~₩30 | 매 답변마다 3~5초 대기 |
| FULL_PROCESS | 1회 (사전 생성) | ~₩50 | 첫 질문 5~8초, 이후 즉시 |

## 관련 코드 / FR

- [FR-INT-10/14/15](../../report-drafts/fr/interview/) — 질문 생성 FR
- 코드: `backend/webapp/interviews/services/start_interview_service.py`, `submit_answer_and_generate_followup_service.py`
- [ADR-011](../../report-drafts/decisions/011-ticket-system.md) — 모드별 티켓 비용
