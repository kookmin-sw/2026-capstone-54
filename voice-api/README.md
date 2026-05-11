# Voice API

edge-tts (Microsoft Edge TTS)를 사용한 Text-to-Speech API 서비스입니다.

## 주요 기능

- 🎤 edge-tts를 사용한 텍스트 음성 변환
- 🌍 14개 이상의 언어 지원
- 🔊 음성 파라미터 커스터마이징 (속도, 볼륨, 음높이)
- 🔐 백엔드 API를 통한 Bearer 토큰 인증
- 🐳 Docker 지원
- 🚀 FastAPI 프레임워크

## 개발 환경 설정

### 사전 요구사항

- Python 3.14+
- [uv](https://github.com/astral-sh/uv) 패키지 매니저

### 설치

```bash
# 의존성 설치
uv sync

# 개발 의존성 설치 (ruff, mypy, pre-commit 포함)
uv sync --extra dev

# pre-commit 훅 설치
uv run pre-commit install
```

### 로컬 실행

```bash
# 서버 실행
uv run uvicorn app.main:app --reload --port 8001

# 또는 제공된 스크립트 사용
./tool.sh
```

### 코드 품질

이 프로젝트는 코드 품질을 위해 최신 Python 도구를 사용합니다:

- **ruff**: 빠른 Python 린터 및 포맷터 (black, isort, flake8 대체)
- **mypy**: 정적 타입 검사기
- **pre-commit**: 자동화된 검사를 위한 Git 훅

#### 수동으로 검사 실행

```bash
# 린터 실행
uv run ruff check app/

# 자동 수정과 함께 린터 실행
uv run ruff check --fix app/

# 포맷터 실행
uv run ruff format app/

# 타입 검사기 실행
uv run mypy app/

# 모든 pre-commit 훅 실행
uv run pre-commit run --all-files
```

#### Pre-commit 훅

Pre-commit 훅은 `git commit` 시 자동으로 실행됩니다. 다음 작업을 수행합니다:

1. 자동 수정과 함께 ruff 린터 실행
2. ruff 포맷터 실행
3. 줄 끝 공백 검사
4. 파일 끝 수정
5. YAML, JSON, TOML 파일 유효성 검사
6. 대용량 파일 검사
7. 머지 충돌 검사
8. mypy 타입 검사기 실행

훅을 건너뛰려면 (권장하지 않음):

```bash
git commit --no-verify
```

### 설정

설정은 다음을 통해 관리됩니다:

- `pyproject.toml`: 프로젝트 메타데이터, 의존성 및 도구 설정
- `.pre-commit-config.yaml`: Pre-commit 훅 설정
- `app/core/config.py`: 애플리케이션 설정
- `app/core/constants.py`: 언어 및 음성 상수

## API 엔드포인트

### 공개 엔드포인트 (인증 불필요)

- `GET /api/v1/languages` - 지원 언어 목록 조회
- `GET /api/v1/voices-by-language` - 언어별 음성 목록 조회
- `GET /api/v1/parameters` - 파라미터 범위 조회

### 인증 필요 엔드포인트

- `GET /api/v1/voices` - edge-tts의 전체 322개 음성 목록 조회
- `POST /api/v1/tts` - 텍스트를 음성으로 변환

## Docker

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
│   │   ├── routes/          # API 라우트 모듈
│   │   │   ├── language.py  # 언어 엔드포인트
│   │   │   ├── parameter.py # 파라미터 엔드포인트
│   │   │   ├── voice.py     # 음성 엔드포인트
│   │   │   └── tts.py       # TTS 엔드포인트
│   │   ├── schemas/         # Pydantic 스키마
│   │   │   ├── language.py  # 언어 스키마
│   │   │   ├── parameter.py # 파라미터 스키마
│   │   │   ├── voice.py     # 음성 스키마
│   │   │   └── tts.py       # TTS 스키마
│   │   └── dependencies.py  # FastAPI 의존성
│   ├── core/
│   │   ├── config.py        # 앱 설정
│   │   └── constants.py     # 언어/음성 상수
│   ├── services/
│   │   ├── auth.py          # 인증 서비스
│   │   └── tts.py           # TTS 서비스
│   └── main.py              # FastAPI 앱
├── pyproject.toml           # 프로젝트 설정 및 의존성
├── .pre-commit-config.yaml  # Pre-commit 훅
└── Dockerfile               # Docker 설정
```

## 기여 방법

1. pre-commit 훅 설치: `uv run pre-commit install`
2. 변경 사항 작성
3. 검사 실행: `uv run pre-commit run --all-files`
4. 변경 사항 커밋 (훅이 자동으로 실행됩니다)
5. Pull Request 제출

## 라이선스

MIT
