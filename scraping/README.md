# 채용공고 스크래퍼

다양한 채용 플랫폼의 공고 URL을 입력하면 핵심 정보를 자동으로 추출하여 JSON으로 저장하는 파이프라인입니다.

```
URL 입력 → HTML 수집 → 이미지 OCR (있을 경우) → GPT 구조화 추출 → JSON 저장
```

---

## 주요 기능

- **2단계 Fallback HTML 수집** — httpx 직접 요청 → 실패 시 Playwright 브라우저로 자동 전환
- **이미지 공고 처리** — Vision OCR로 이미지 속 텍스트를 읽어낸 뒤 텍스트 기반 추출
- **플랫폼별 플러그인** — 잡코리아, 잡플래닛 등 특수 구조 사이트 전용 처리
- **봇 탐지 우회** — User-Agent 랜덤화, stealth 스크립트, Cloudflare 챌린지 대응
- **Celery 비동기 처리** — 백엔드 연동을 위한 Redis 기반 태스크 큐 지원

---

## 파일 구조

```
scraping/
├── main.py                 # CLI 진입점
├── scraper.py              # 공통 진입 함수 (CLI / Celery 양쪽에서 호출)
├── pipeline.py             # 핵심 파이프라인 (수집 전략 + LLM 추출 조율)
├── config.py               # 전역 설정 (API 키, 타임아웃, DB 등)
├── celery_app.py           # Celery 앱 설정 및 Worker 브라우저 관리
├── tasks.py                # Celery 비동기 태스크 (DB 저장 포함)
│
├── extractors/
│   ├── llm_extractor.py    # GPT 텍스트 추출 + Vision OCR + 이미지 분할
│   └── schema.py           # JobPosting 데이터 구조 및 정규화
│
├── plugins/
│   ├── base.py             # 플러그인 공통 인터페이스
│   ├── registry.py         # 도메인 → 플러그인 자동 매핑
│   ├── default.py          # 범용 스크래퍼 (스크롤 + 더보기 클릭)
│   ├── jobkorea.py         # 잡코리아 전용 (SPA iframe 처리)
│   └── jobplanet.py        # 잡플래닛 전용 (임베드 iframe 추출)
│
├── schemas/
│   ├── job_posting.py      # 채용공고 Pydantic 모델
│   ├── job_description.py  # DB 테이블 SQLAlchemy 매핑
│   └── ...                 # 각 모듈별 I/O 스키마
│
├── utils/
│   ├── browser.py          # Playwright 브라우저 생성 및 stealth 설정
│   ├── anti_bot.py         # User-Agent 랜덤화, 봇 차단 감지
│   └── logger.py           # 공통 로거
│
├── db/
│   └── connection.py       # SQLAlchemy 엔진/세션 (PostgreSQL)
│
└── output/                 # 추출 결과 JSON 저장 폴더
```

---

## 수집 전략

### HTML 수집 (2단계 Fallback)

```
플러그인 PREFERS_BROWSER = True?
  ├─ YES → Playwright 직접 사용 (React SPA 등)
  └─ NO  → 1단계: httpx 직접 요청
                ├─ 봇 차단 감지 (403/429/Cloudflare)
                ├─ 불완전 HTML (제목 구조 없음)
                └─ 더보기 버튼 감지
                      └─→ 2단계: Playwright로 자동 재시도
```

### Playwright 처리 순서

```
plugin.setup(page)          ← 네트워크 인터셉터 등록
page.goto(url)
wait networkidle
plugin.before_extract(page) ← 버튼 클릭 / iframe 주입 / 스크롤
iframe 수집                  ← 동일도메인 ID매칭 > 외부도메인
이미지 수집                  ← 플러그인 캡처 > 직접URL(httpx) > 스크린샷
HTML 최종 수집
```

---

## LLM 추출 전략

```
HTML 텍스트 정제
     +
이미지 있음? → Vision OCR (gpt-4o)로 이미지 속 텍스트 읽기
     ↓
병합된 텍스트 (HTML + OCR)
     ↓
gpt-4o-mini로 구조화 추출 → JSON
```

### 이미지 공고 처리

1. 메인 페이지의 큰 이미지를 httpx로 다운로드 → base64 변환
2. 세로 2000px 초과 이미지는 자동 분할 (Vision 인식률 향상)
3. 배너/로고(가로 > 세로×3) 자동 제외
4. RGBA(PNG) → RGB 자동 변환
5. Vision OCR은 텍스트 읽기만 수행, 구조화는 gpt-4o-mini가 담당

---

## 출력 스키마

| 필드 | 내용 |
|------|------|
| `url` | 원본 채용공고 URL |
| `platform` | 플랫폼명 |
| `company` | 회사명 |
| `title` | 공고 제목 |
| `duties` | 담당업무 |
| `requirements` | 지원자격 |
| `preferred` | 우대사항 |
| `work_type` | 고용형태 |
| `salary` | 급여 |
| `location` | 근무지역 |
| `education` | 학력 |
| `experience` | 경력 |

---

## 플랫폼별 처리 현황

| 플랫폼 | 상태 | 처리 방식 |
|--------|:----:|-----------|
| 사람인 | ✅ | relay URL 자동 변환, 이미지 공고 Vision OCR 지원 |
| 잡코리아 | ✅ | Next.js SPA iframe + React 하이드레이션 대기 |
| 잡플래닛 | ✅ | jobkorea 임베드 iframe 직접 추출 |
| 기업 직채 페이지 | ✅ | DefaultScraper + Vision OCR로 범용 대응 |
| 원티드/점핏/로켓펀치 | 미테스트 | DefaultScraper로 동작 가능 |

---

## 실행 방법

### 사전 조건

```bash
# Playwright 브라우저 설치 (최초 1회)
uv run playwright install chromium

# .env 파일에 API 키 설정
OPENAI_API_KEY=sk-...
```

### CLI 단건 실행

```bash
uv run main.py <채용공고_URL>
uv run main.py <URL> --output results/my_job.json
uv run main.py <URL> --no-headless   # 브라우저 창 표시 (디버깅용)
```

### Celery Worker 실행

```bash
# backend 먼저 실행 (별도 터미널)
cd ../backend && docker compose up

# scraper worker 실행
docker compose up --build
```

### Docker 네트워크 (최초 1회)

```bash
docker network create mefit-local
```

---

## 주요 의존성

| 패키지 | 용도 |
|--------|------|
| Playwright | 브라우저 자동화 (Chromium) |
| httpx | 비동기 HTTP 클라이언트 |
| LangChain + OpenAI | GPT 텍스트/Vision 추출 |
| Pillow | 이미지 분할 처리 |
| BeautifulSoup + lxml | HTML 파싱/정제 |
| Celery + Redis | 비동기 태스크 큐 |
| SQLAlchemy + psycopg2 | PostgreSQL DB 연동 |
| fake-useragent | User-Agent 랜덤화 |

---

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `OPENAI_API_KEY` | (필수) | OpenAI API 키 |
| `OPENAI_MODEL` | `gpt-4o-mini` | 텍스트 추출 모델 |
| `OPENAI_VISION_MODEL` | `gpt-4o` | Vision OCR 모델 |
| `HEADLESS` | `true` | 브라우저 headless 모드 |
| `LOG_LEVEL` | `INFO` | 로그 레벨 |
| `LLM_MAX_TEXT_CHARS` | `10000` | LLM 전달 텍스트 최대 길이 |
| `CELERY_BROKER_URL` | `redis://localhost:6379/0` | Celery 브로커 |
| `DATABASE_URL` | (자동 생성) | PostgreSQL 접속 URL |
