# Backend

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

### 3. pre-commit 훅 설치

커밋 전 코드 품질 검사를 자동으로 실행하는 pre-commit 훅을 설치합니다.

```bash
uv run pre-commit install
```

설치가 완료되면 `git commit` 시 아래 검사가 자동으로 실행됩니다.

| 훅 | 설명 |
|---|---|
| `yapf` | PEP8 기반 코드 포맷터 (최대 120자) |
| `flake8` | 코드 스타일 및 오류 검사 |
| `isort` | import 구문 자동 정렬 |
| `trailing-whitespace` | 줄 끝 공백 제거 |
| `end-of-file-fixer` | 파일 끝 개행 보장 |
| `check-yaml` | YAML 문법 검사 |
| `pretty-format-json` | JSON 포맷 정렬 |
| `check-added-large-files` | 500KB 초과 파일 커밋 방지 |

### 4. 개발 서버 실행

```bash
uv run python webapp/manage.py runserver
```

### 5. Docker 개발 환경 실행

```bash
docker compose up
```

> **최초 1회 — 공유 Docker 네트워크 생성 필요**
>
> scraping 프로젝트의 Celery Worker가 이 프로젝트의 Redis에 접근하기 위해
> 두 프로젝트가 공유하는 외부 네트워크가 필요합니다.
>
> ```bash
> docker network create mefit-local
> ```
>
> 이후 `docker compose up` 시 Redis가 `mefit-local` 네트워크에 자동으로 참여합니다.

## 테스트 실행

### 전체 테스트 실행

```bash
docker-compose exec webapp python manage.py test --keepdb
```

### 특정 모듈 테스트 실행

```bash
docker-compose exec webapp python manage.py test subscriptions.tests.services.test_grant_initial_subscription_tickets_service --keepdb
```

### 특정 테스트 클래스 실행

```bash
docker-compose exec webapp python manage.py test subscriptions.tests.services.test_grant_initial_subscription_tickets_service.GrantInitialSubscriptionTicketsServiceTests --keepdb
```

### 특정 테스트 메서드 실행

```bash
docker-compose exec webapp python manage.py test subscriptions.tests.services.test_grant_initial_subscription_tickets_service.GrantInitialSubscriptionTicketsServiceTests.test_grants_initial_tickets_for_free_plan --keepdb
```

### 상세 출력과 함께 테스트 실행

```bash
docker-compose exec webapp python manage.py test --keepdb -v 2
```

> **`--keepdb` 옵션**
>
> 테스트 데이터베이스를 테스트 완료 후에도 유지합니다.
> 이를 통해 다음 테스트 실행 시 데이터베이스 생성 시간을 단축할 수 있습니다.
