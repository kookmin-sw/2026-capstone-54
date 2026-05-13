# MeFit Backend

Django 6.0+ / DRF 3.16+ 기반 면접 준비 플랫폼 백엔드입니다.
Python 3.12+, PostgreSQL, Redis, Celery, Django Channels (WebSocket/SSE), LangChain + OpenAI를 사용합니다.

---

## 목차

- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [개발 환경 설정](#개발-환경-설정)
- [테스트 실행](#테스트-실행)
- [유용한 명령어 스크립트](#유용한-명령어-스크립트)

---

## 기술 스택

| 항목 | 버전 / 내용 |
|---|---|
| Python | >= 3.12 |
| Django | 6.0+ |
| Django REST Framework | 3.16+ |
| DB | PostgreSQL (django-postgres-extra) |
| 비동기 태스크 | Celery 5.x + Redis |
| 실시간 통신 | Django Channels (WebSocket / SSE) + Redis Channel Layer |
| LLM | LangChain + OpenAI (ChatOpenAI) |
| 벡터 검색 | pgvector |
| 파일 스토리지 | AWS S3 (django-storages) |
| 패키지 관리 | uv (pyproject.toml) |
| 코드 포맷 | yapf (indent=2), isort (profile=black), flake8 |
| API 문서 | drf-spectacular (OpenAPI 3.0) |
| Admin UI | django-unfold |
| JSON 직렬화 | CamelCase ↔ snake_case 자동 변환 (djangorestframework-camel-case) |

---

## 프로젝트 구조

```
backend/
├── webapp/
│   ├── achievements/          # 업적 도메인
│   ├── api/v1/                # API 레이어 (views, serializers, urls, consumers)
│   ├── common/                # 공통 베이스 클래스 (models, services, views 등)
│   ├── config/                # Django 설정 (settings, urls, asgi, celery)
│   ├── dashboard/             # 대시보드 도메인
│   ├── interviews/            # 면접 세션 도메인
│   ├── job_descriptions/      # 채용공고 도메인
│   ├── llm_trackers/          # LLM 토큰 사용량 추적
│   ├── notifications/         # 알림 도메인
│   ├── profiles/              # 사용자 프로필 도메인
│   ├── realtime_docs/         # 실시간 문서 도메인
│   ├── resumes/               # 이력서 도메인
│   ├── streaks/               # 연속 학습 도메인
│   ├── subscriptions/         # 구독/티켓 도메인
│   ├── terms_documents/       # 약관 도메인
│   ├── tickets/               # 이용권 도메인
│   └── users/                 # 사용자 도메인
├── environments/
│   ├── development/           # 개발 환경 Dockerfile, 스크립트
│   └── production/            # 운영 환경 설정
├── docs/                      # 아키텍처 및 가이드 문서
├── docker-compose.yml
├── pyproject.toml
└── .env.sample
```

각 도메인 앱은 도메인 레이어(`webapp/앱명/`)와 API 레이어(`webapp/api/v1/앱명/`)로 분리됩니다.

```
webapp/interviews/             # 도메인 레이어 (비즈니스 로직)
├── admin/
├── enums/
├── factories/
├── migrations/
├── models/
├── schemas/                   # Pydantic 스키마 (LLM I/O)
├── services/
│   └── llm/                   # LLM 관련 서비스
├── signals/
├── tasks/
└── tests/

webapp/api/v1/interviews/      # API 레이어 (표현 계층)
├── serializers/
├── views/
├── tests/
├── consumers.py               # WebSocket / SSE Consumer
├── routing.py
└── urls.py
```

---

## 개발 환경 설정

### 1. uv 설치

[uv](https://docs.astral.sh/uv/)는 Python 패키지 관리자입니다.

**macOS / Linux**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

설치 후 터미널을 재시작하거나 아래 명령어로 환경변수를 적용하세요.

```bash
source $HOME/.local/bin/env  # macOS / Linux (uv 설치 경로에 따라 다를 수 있습니다.)
```

### 2. 의존성 설치

```bash
uv sync
```

### 3. 환경 변수 설정

`.env.sample`을 복사하여 `.env` 파일을 생성하고 값을 채웁니다.

```bash
cp .env.sample .env
```

### 4. pre-commit 훅 설치

커밋 전 코드 품질 검사를 자동으로 실행하는 pre-commit 훅을 설치합니다.

```bash
uv run pre-commit install
```

설치가 완료되면 `git commit` 시 아래 검사가 자동으로 실행됩니다.

| 훅 | 설명 |
|---|---|
| `yapf` | PEP8 기반 코드 포맷터 (최대 120자, indent=2) |
| `flake8` | 코드 스타일 및 오류 검사 |
| `isort` | import 구문 자동 정렬 |
| `trailing-whitespace` | 줄 끝 공백 제거 |
| `end-of-file-fixer` | 파일 끝 개행 보장 |
| `check-yaml` | YAML 문법 검사 |
| `pretty-format-json` | JSON 포맷 정렬 |
| `check-added-large-files` | 500KB 초과 파일 커밋 방지 |

### 5. 개발 서버 실행 (Docker 없이)

```bash
uv run python webapp/manage.py runserver
```

---

## 테스트 실행

### 전체 테스트 실행

```bash
bash environments/development/commands/08-test.sh
```

### 특정 모듈 테스트 실행

```bash
bash environments/development/commands/08-test.sh interviews.tests
```

### 특정 테스트 클래스 실행

```bash
bash environments/development/commands/08-test.sh subscriptions.tests.services.test_grant_initial_subscription_tickets_service.GrantInitialSubscriptionTicketsServiceTests
```

### 특정 테스트 메서드 실행

```bash
bash environments/development/commands/08-test.sh subscriptions.tests.services.test_grant_initial_subscription_tickets_service.GrantInitialSubscriptionTicketsServiceTests.test_grants_initial_tickets_for_free_plan
```

### 상세 출력과 함께 테스트 실행

```bash
bash environments/development/commands/08-test.sh --keepdb -v 2
```

### docker-compose exec 직접 사용

```bash
docker-compose exec webapp python manage.py test --keepdb
docker-compose exec webapp python manage.py test interviews.tests --keepdb -v 2
```

> **`--keepdb` 옵션**
>
> 테스트 데이터베이스를 테스트 완료 후에도 유지합니다.
> 다음 테스트 실행 시 DB 생성 시간을 단축할 수 있습니다.

---

## 유용한 명령어 스크립트

### tool.sh — 인터랙티브 메뉴

`tool.sh`는 아래 명령어 스크립트들을 번호 메뉴로 선택해 실행할 수 있는 CLI 래퍼입니다.
Windows Git Bash 환경도 지원하며, `docker compose` / `docker-compose` 양쪽을 자동으로 감지합니다.

```bash
bash tool.sh
```

실행하면 아래와 같은 메뉴가 출력됩니다.

```
Available actions:
   1) 전체 Django 명령어
   2) 슈퍼유저 생성 (createsuperuser)
   3) 커스텀 Django 명령어
   4) 로그 스트리밍 (logs)
   5) 마이그레이션 생성 (makemigrations)
   6) 마이그레이션 적용 (migrate)
   7) Django Shell 접속 (shell)
   8) 테스트 실행 (test)
   9) docker-compose up -d --build (build & start)
  10) docker-compose up -d (start)
  11) docker-compose down (stop)
  12) PostgreSQL 콘솔 접속 (db-console)
  13) SQL 명령어 실행 (db-exec)
  14) SQS Celery Worker 시작 (sqs-worker)
  q) Quit
```

번호를 입력하면 해당 스크립트가 실행되고, 인자가 필요한 경우 추가로 입력을 받습니다.
