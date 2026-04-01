# 채용공고 스크래퍼 — 중간 점검 문서

> 작성일: 2026-04-01

---

## 프로젝트 개요

다양한 채용 플랫폼의 공고 URL을 입력하면 **담당업무 · 자격요건 · 우대사항** 등의 핵심 정보를 자동으로 추출하여 JSON 파일로 저장하는 파이프라인입니다.

```
URL 입력  →  HTML 수집  →  GPT 추출  →  JSON 저장
```

---

## 파일 구조

```
scraping/
├── main.py                      # 진입점. URL 인자 받아 결과 출력
├── pipeline.py                  # 핵심 파이프라인. 수집 전략 조율
├── config.py                    # 전역 설정 (API 키, 타임아웃, 모델명 등)
│
├── extractors/
│   ├── llm_extractor.py         # GPT 호출 (텍스트 추출 / Vision 추출)
│   └── schema.py                # JobPosting 데이터 구조 및 정규화
│
├── plugins/
│   ├── base.py                  # 플러그인 공통 인터페이스 (BaseScraper)
│   ├── registry.py              # 도메인 → 플러그인 매핑 테이블
│   ├── default.py               # 기본 스크래퍼 (플러그인 없는 사이트용)
│   ├── jobkorea.py              # 잡코리아 전용 플러그인
│   └── jobplanet.py             # 잡플래닛 전용 플러그인
│
├── utils/
│   ├── browser.py               # Playwright 브라우저 생성 및 봇 위장 설정
│   ├── anti_bot.py              # User-Agent 랜덤화, 스텔스 스크립트
│   └── logger.py                # 로깅 설정
│
└── output/                      # 추출 결과 JSON 저장 폴더
```

---

## 수집 전략

### 1단계 / 2단계 Fallback 구조

```
플러그인 PREFERS_BROWSER = True?
  └─ YES → 처음부터 Playwright (React SPA 등 JS 렌더링 필수 사이트)
  └─ NO  → 1단계: httpx 직접 요청 (빠름)
               │
               ├─ 봇 차단 감지 (403/429, "Just a moment")
               ├─ 텍스트 너무 짧음 (< 1000자)
               └─ 더보기 버튼 감지
                     └─→ 2단계: Playwright로 자동 재시도
```

### Playwright 처리 순서

```
plugin.setup(page)          ← 네트워크 인터셉터 등록 (goto 이전)
page.goto(url)
wait networkidle
plugin.before_extract(page) ← 버튼 클릭 / iframe 주입 / 스크롤 등
iframe 수집                  ← 동일도메인 ID매칭 > 외부도메인 순위
이미지 수집                  ← 플러그인 캡처 > 직접URL(httpx) > 스크린샷
HTML 최종 수집
```

---

## 추출 로직 (GPT)

```
텍스트 >= 300자
  → gpt-4o-mini 로 텍스트 추출
  → duties/preferred 비어 있고 이미지 있음?
       └─→ gpt-4o Vision 으로 보완

텍스트 < 300자 + 이미지 있음
  → 바로 gpt-4o Vision 으로 처리
```

### 출력 스키마 (JobPosting)

| 필드 | 내용 |
|------|------|
| `company` | 회사명 |
| `title` | 공고 제목 |
| `duties` | 담당업무 |
| `requirements` | 지원자격 |
| `preferred` | 우대사항 |
| `work_type` | 고용형태 (정규직/계약직 등) |
| `salary` | 급여 |
| `location` | 근무지역 |
| `education` | 학력 |
| `experience` | 경력 |

---

## 플랫폼별 처리 현황

| 플랫폼 | 상태 | 처리 방식 |
|--------|:----:|-----------|
| **사람인** | ✅ 완료 | relay URL → 직접 URL 자동 변환 |
| **잡코리아** | ✅ 완료 | Next.js SPA iframe 처리 (아래 참고) |
| **잡플래닛** | ✅ 완료 | jobkorea 임베드 iframe 직접 추출 (아래 참고) |
| 원티드 | 미테스트 | |
| 점핏 | 미테스트 | |
| 로켓펀치 | 미테스트 | |
| 프로그래머스 | 미테스트 | |
| 기업 직채 페이지 | 미테스트 | |

---

## 플러그인 상세

### 잡코리아 (`plugins/jobkorea.py`)

**문제:** 공고 본문이 Next.js SPA iframe 안에 있고, React 하이드레이션 완료 전까지 `visibility:hidden` 상태라 내용이 비어 보임

**해결:**
1. `#detail-content:not(.invisible)` 셀렉터로 하이드레이션 완료 대기
2. 텍스트 공고 → `textContent` 추출 후 메인 DOM에 주입
3. 이미지 공고 → `#detail-content` 요소 스크린샷 → Vision LLM 전달

### 잡플래닛 (`plugins/jobplanet.py`)

**문제:** 담당업무/지원자격 내용이 `m.jobkorea.co.kr` 도메인의 iframe에 임베드되어 있고, 파이프라인의 외부 iframe 병합 임계값(1000자)에 걸려 자동 병합이 안 됨

**해결:**
1. `GIReadDetailContentBlind` iframe을 프레임 목록에서 직접 탐색
2. iframe 본문 텍스트 추출
3. 메인 DOM에 숨김 div(`#__jobplanet_detail__`)로 주입 → 파이프라인이 자동 포함

---

## 해결한 주요 기술 이슈

| 이슈 | 원인 | 해결 |
|------|------|------|
| 잡코리아 duties 누락 | React `visibility:hidden` 하이드레이션 타이밍 | `:not(.invisible)` 대기 후 추출 |
| 잡플래닛 duties 누락 | 내용이 외부 iframe에 있고 병합 임계값 초과 | 플러그인에서 직접 추출 후 DOM 주입 |
| OpenAI 400 에러 | Google Ads iframe URL이 Vision LLM에 전달됨 | `_AD_DOMAINS` 이중 필터 적용 |
| CORS 이미지 다운로드 실패 | `page.evaluate(fetch)`는 브라우저 CORS 정책 적용 | 서버 사이드 httpx로 다운로드 |
| `//` 프로토콜 상대 URL | BeautifulSoup이 `//cdn.example.com` 을 그대로 반환 | `https:` 접두어 자동 보정 |
| Playwright "Execution context destroyed" | `page.evaluate()` 내 JS async 루프 중 페이지 이동 | `page.mouse.wheel()` Python 레벨 스크롤로 전환 |

---

## 로컬 실행

### 사전 조건

scraping worker는 backend 프로젝트의 Redis를 브로커로 사용합니다.
backend 프로젝트를 먼저 실행한 후, 아래 순서대로 진행하세요.

> **최초 1회 — 공유 Docker 네트워크 생성 필요**
>
> ```bash
> docker network create mefit-local
> ```
>
> 두 프로젝트의 컨테이너가 같은 네트워크에서 통신하기 위해 필요합니다.

### Worker 실행

```bash
# 1. backend 먼저 실행 (별도 터미널)
cd ../backend && docker compose up

# 2. scraper worker 실행
docker compose up --build
```

### CLI로 단건 테스트 (로컬 Python 환경)

```bash
uv run main.py <채용공고_URL>
```

---

## 남은 작업

- [ ] 원티드 / 점핏 / 로켓펀치 / 프로그래머스 테스트 및 플러그인 추가
- [ ] 기업 직채 페이지 대응 (구조가 사이트마다 다름)
- [ ] 이미지 기반 공고에서 GPT-4o 거부 케이스 대응
  - GPT-4o가 상업용 이미지(사람·제품 포함)를 정책 위반으로 거부하는 경우 발생
  - Claude Vision API 대체 적용 예정 (API 키 발급 후 진행)
