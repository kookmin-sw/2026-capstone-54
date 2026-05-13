# Sequence — 이력서 분석

| 항목 | 내용 |
|---|---|
| **종류** | Sequence Diagram |
| **PUML** | [`sequence-resume-analysis.puml`](./sequence-resume-analysis.puml) |
| **이미지** | [`../out/sequence_diagrams/sequence-resume-analysis.png`](../out/sequence_diagrams/sequence-resume-analysis.png) |

## 목적

사용자가 이력서를 업로드 / 입력 후 **analysis-resume Worker** 가 분석하는 비동기 시퀀스를 상세 표현. SSE 실시간 진행 상태 + Celery chord 병렬 처리를 포함합니다.

## 참여자

- **Frontend** (ResumeNewPage / ResumeAnalysisProgress)
- **Backend** (CreateFileResumeService / CreateTextResumeService)
- **Celery (analysis-resume queue)**
- **analysis-resume Worker** (extract_text_task / analyze_resume_task / embed_resume_task / finalize_resume_task)
- **OpenAI** (gpt-4o-mini + text-embedding-3-small)
- **S3** (resume bucket)
- **PostgreSQL + pgvector**
- **SSE Consumer** (`ResumeAnalysisStatusConsumer`)

## 핵심 시퀀스

1. **입력**: 파일 업로드 (S3) 또는 텍스트 직접 입력
2. **태스크 발행**: CreateFileResumeService → Celery chord:
   ```
   extract_text → analyze_resume (LLM 병렬 청크) → embed_resume → finalize_resume
   ```
3. **각 단계별 SSE push**: `Resume.analysis_step` 갱신 → 1.5초 polling Consumer → 클라이언트 progress
4. **LLM 분석**: gpt-4o-mini + `with_structured_output(ParsedResumeData)` Pydantic 강제
5. **임베딩**: text-embedding-3-small 1536 차원 → pgvector
6. **콜백**: Worker → backend `apply_analysis_result_task` → 13 sub-model (BasicInfo / Summary / Experience / ...) 정규화 저장

## 핵심 기술

- **Celery chord** — 병렬 청크 → 머지
- **ThreadPoolExecutor 4 worker** — LLM 청크 병렬
- **Pydantic with_structured_output** — LLM 결정론
- **TokenUsageCallback** — 비용 자동 기록

## 관련 코드 / FR

- [FR-RESUME-01~15](../../report-drafts/fr/resume/) — 이력서 도메인 FR
- 코드: [`analysis-resume/app/tasks/`](../../analysis-resume/app/tasks/)
- 프로젝트 명세: [`02-3a-by-project/03-analysis-resume.md`](../../report-drafts/02-3a-by-project/03-analysis-resume.md)
