# Voice API

Microsoft Edge TTS를 활용한 Text-to-Speech API 서비스입니다.

## 주요 기능

- 🎤 edge-tts 기반 텍스트 음성 변환 (TTS)
- 🌍 14개 이상 언어 지원
- 🔊 음성 파라미터 커스터마이징 (속도, 볼륨, 음높이)
- 🔐 백엔드 API를 통한 Bearer 토큰 인증
- 🐳 Docker 지원
- 🚀 FastAPI 프레임워크

## 개발 환경 설정

### 사전 요구사항

- Python 3.14+
- [uv](https://github.com/astral-sh/uv) 패키지 매니저

### 의존성 설치

```bash
# 기본 의존성 설치
uv sync

# 개발 의존성 포함 설치 (ruff, mypy, pre-commit)
uv sync --extra dev

# pre-commit 훅 설치
uv run pre-commit install
```

### 로컬 실행

```bash
# 서버 실행
uv run uvicorn app.main:app --reload --port 8001
```

### 코드 품질 도구

| 도구 | 역할 |
|------|------|
| **ruff** | 린터 + 포맷터 (black, isort, flake8 대체) |
| **mypy** | 정적 타입 검사 |
| **pre-commit** | 커밋 전 자동 검사 훅 |

#### 수동 실행

```bash
# 린트 검사
uv run ruff check app/

# 린트 자동 수정
uv run ruff check --fix app/

# 코드 포맷
uv run ruff format app/

# 타입 검사
uv run mypy app/

# 전체 pre-commit 훅 실행
uv run pre-commit run --all-files
```

#### pre-commit 훅 목록

`git commit` 시 아래 검사가 자동으로 실행됩니다.

1. ruff 린터 (자동 수정 포함)
2. ruff 포맷터
3. 줄 끝 공백 제거
4. 파일 끝 개행 보장
5. YAML, JSON, TOML 문법 검사
6. 대용량 파일 커밋 방지
7. 머지 충돌 마커 검사
8. mypy 타입 검사

훅을 건너뛰려면 (권장하지 않음):

```bash
git commit --no-verify
```

### 설정 파일

| 파일 | 역할 |
|------|------|
| `pyproject.toml` | 프로젝트 메타데이터, 의존성, 도구 설정 |
| `.pre-commit-config.yaml` | pre-commit 훅 설정 |
| `app/core/config.py` | 애플리케이션 설정 |
| `app/core/constants.py` | 언어 및 음성 상수 |

## API 엔드포인트

### 공개 엔드포인트 (인증 불필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/v1/languages` | 지원 언어 목록 조회 |
| `GET` | `/api/v1/voices-by-language` | 언어별 음성 목록 조회 |
| `GET` | `/api/v1/parameters` | 파라미터 범위 조회 |

### 인증 필요 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/v1/voices` | 전체 음성 목록 조회 (322개) |
| `POST` | `/api/v1/tts` | 텍스트 → 음성 변환 |

## Docker 실행

```bash
# 이미지 빌드
docker build -t voice-api .

# 컨테이너 실행
docker-compose up -d
```

## 프로젝트 구조

```
voice-api/
├── app/
│   ├── api/
│   │   ├── routes/          # API 라우트
│   │   │   ├── language.py  # 언어 엔드포인트
│   │   │   ├── parameter.py # 파라미터 엔드포인트
│   │   │   ├── voice.py     # 음성 엔드포인트
│   │   │   └── tts.py       # TTS 엔드포인트
│   │   ├── schemas/         # Pydantic 스키마
│   │   │   ├── language.py
│   │   │   ├── parameter.py
│   │   │   ├── voice.py
│   │   │   └── tts.py
│   │   └── dependencies.py  # FastAPI 의존성
│   ├── core/
│   │   ├── config.py        # 앱 설정
│   │   └── constants.py     # 언어/음성 상수
│   ├── services/
│   │   ├── auth.py          # 인증 서비스
│   │   └── tts.py           # TTS 서비스
│   └── main.py              # FastAPI 앱 진입점
├── pyproject.toml           # 프로젝트 설정 및 의존성
├── .pre-commit-config.yaml  # pre-commit 훅 설정
└── Dockerfile               # Docker 설정
```
