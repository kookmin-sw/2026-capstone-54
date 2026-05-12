# Sequence — 채용공고 URL 수집

| 항목 | 내용 |
|---|---|
| **종류** | Sequence Diagram |
| **PUML** | [`sequence-jobposting-scraping.puml`](./sequence-jobposting-scraping.puml) |
| **이미지** | [`../out/sequence_diagrams/sequence-jobposting-scraping.png`](../out/sequence_diagrams/sequence-jobposting-scraping.png) |

## 목적

사용자가 채용공고 URL 입력 시 **scraping Worker** 의 2 단계 fallback (httpx → Playwright) + Vision 분기 흐름을 시퀀스로 표현.

## 참여자

- **Frontend** (JdAddPage)
- **Backend** (CreateUserJobDescriptionService)
- **Celery (scraping queue)**
- **scraping Worker** (pipeline.py + plugins/)
- **httpx / Playwright** (스크래핑 도구)
- **OpenAI** (gpt-4o-mini / gpt-4o Vision)
- **SSE Consumer** (`UserJobDescriptionScrapingStatusConsumer`)

## 핵심 시퀀스

1. **URL 입력**: `POST /api/v1/user-job-descriptions/` → JobDescription / UserJobDescription 생성 (`collection_status=PENDING`)
2. **Celery 디스패치**: scraping queue → `scrape_job_posting` task
3. **Stage 1 (httpx)**: 가벼운 HTTP GET → 봇 차단 / SPA / 텍스트 부족 검사
4. **Stage 2 (Playwright fallback)**: 사이트별 plugin (`saramin / jobkorea / jobplanet / default`) 의 `extract()` 실행
5. **LLM 추출 분기**:
   - 텍스트 ≥ 300자 + 핵심 필드 OK → gpt-4o-mini
   - 텍스트 < 300자 + 이미지 → gpt-4o Vision (즉시)
   - 텍스트 OK + 핵심 필드 비어있음 + 이미지 → Vision 보충
6. **RDS write-back**: `JobDescription.collection_status=DONE` + 추출 필드 저장
7. **SSE 통보**: 1.5초 polling Consumer → 클라이언트 status 실시간 갱신

## 핵심 기술

- **Strategy Pattern** — 사이트별 plugin
- **Chain of Responsibility** — httpx → Playwright fallback
- **광고 도메인 사전 필터** — Vision 토큰 절감

## 관련 코드 / FR

- [FR-JD-01~11](../../report-drafts/fr/jd/) — 채용공고 도메인 FR
- [ADR-021](../../report-drafts/decisions/021-scraping-plugin-strategy.md) — Strategy Pattern
- 코드: [`scraping/pipeline.py`](../../scraping/pipeline.py), [`scraping/plugins/`](../../scraping/plugins/)
