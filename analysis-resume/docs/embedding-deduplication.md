# 임베딩 로직 중복 문제와 해결 방안

## 현재 상황

임베딩 관련 로직이 두 프로젝트에 분산되어 있습니다.

### analysis-resume (Celery Worker)
| 파일 | 역할 |
|------|------|
| `app/tasks/embed_resume.py` | OpenAI 클라이언트 생성, `embed_texts()`, `chunk_text()` |
| `app/tasks/finalize_resume.py` | `embed_texts()` 재사용하여 분석 결과 임베딩 |
| `app/tasks/analyze_resume.py` | `chunk_text()` 재사용하여 LLM 분석용 청킹 |
| `app/config.py` | `OPENAI_EMBEDDING_MODEL`, `CHUNK_SIZE` 등 설정 |

### backend (Django)
| 파일 | 역할 |
|------|------|
| `resumes/services/resume_search_service.py` | OpenAI 클라이언트 생성, `_embed_query()` |
| `resumes/admin/resume_embedding_admin.py` | `_embed_query()` 직접 import하여 사용 |

### 중복되는 것들
- OpenAI 클라이언트 초기화 (싱글턴 패턴, 양쪽 모두)
- 임베딩 모델명 상수 (`text-embedding-3-small`)
- 임베딩 API 호출 로직
- 청킹 함수 (`chunk_text`)

## 해결 방안

### 방안 1: 공유 Python 패키지 (Private PyPI / Git Submodule)

공통 로직을 별도 패키지로 추출하여 양쪽에서 설치합니다.

```
mefit-embedding/
  mefit_embedding/
    __init__.py
    client.py      # OpenAI 클라이언트 싱글턴
    chunker.py     # chunk_text 함수들
    config.py      # 모델명, 차원 등 상수
  pyproject.toml
```

설치:
```toml
# analysis-resume/pyproject.toml
dependencies = ["mefit-embedding @ git+https://github.com/teammefit/mefit-embedding.git"]

# backend/pyproject.toml
dependencies = ["mefit-embedding @ git+https://github.com/teammefit/mefit-embedding.git"]
```

장점:
- 완전한 코드 중복 제거
- 버전 관리 가능
- 테스트를 한 곳에서 관리

단점:
- 별도 저장소 관리 오버헤드
- 패키지 업데이트 시 양쪽 모두 반영 필요
- 작은 팀에서는 과도할 수 있음

### 방안 2: Git Submodule로 공유 디렉토리 (중간 복잡도)

공통 코드를 별도 repo에 두고 submodule로 양쪽에 마운트합니다.

```
backend/
  webapp/
    shared/          ← git submodule
      embedding.py
      chunker.py

analysis-resume/
  shared/            ← 같은 git submodule
    embedding.py
    chunker.py
```

장점:
- PyPI 없이 코드 공유
- 양쪽에서 같은 커밋을 참조

단점:
- submodule 관리가 번거로움
- CI/CD에서 submodule 초기화 필요

### 방안 3: 상수/설정만 통일하고 구현은 각자 유지 (권장)

현실적으로 중복되는 코드량이 크지 않습니다.
핵심 중복은 "임베딩 모델명"과 "OpenAI 호출 패턴" 정도입니다.

이 경우 다음만 통일하면 충분합니다:

1. 임베딩 모델명을 환경변수로 통일

```
# .env (양쪽 공통)
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_EMBEDDING_DIMENSIONS=1536
```

analysis-resume은 이미 `config.py`에서 환경변수로 읽고 있고,
backend는 `settings`에 추가하면 됩니다.

2. 청킹 로직은 analysis-resume에만 존재 (저장 시점에서만 청킹)

backend의 `resume_search_service.py`는 검색 쿼리를 임베딩할 뿐
청킹은 하지 않으므로, 청킹 로직은 analysis-resume에만 있으면 됩니다.

3. OpenAI 클라이언트 초기화는 각 프로젝트의 관례를 따름

- analysis-resume: `config.OPENAI_API_KEY`로 직접 초기화
- backend: `settings.OPENAI_API_KEY`로 Django 설정 경유

이건 프레임워크 차이에서 오는 자연스러운 분기이므로 억지로 통일할 필요 없습니다.

## 권장 사항

현재 프로젝트 규모와 팀 상황을 고려하면 방안 3이 가장 적합합니다.

이유:
- 실제 중복 코드가 10줄 미만 (OpenAI 클라이언트 초기화 + API 호출)
- 별도 패키지를 만들면 관리 포인트만 늘어남
- analysis-resume과 backend는 역할이 명확히 다름 (저장 vs 검색)
- 환경변수로 설정만 통일하면 모델 변경 시 양쪽 동시 반영 가능

만약 향후 임베딩 관련 프로젝트가 3개 이상으로 늘어나거나,
청킹/임베딩 로직이 복잡해지면 그때 방안 1로 전환하는 게 좋습니다.

## 즉시 할 수 있는 개선

1. backend `resume_search_service.py`의 `EMBEDDING_MODEL` 하드코딩을 `settings`로 이동
2. analysis-resume `config.py`의 `OPENAI_EMBEDDING_MODEL` 환경변수명과 backend의 환경변수명 통일 확인
3. 양쪽 `.env.sample`에 임베딩 관련 환경변수 명시

```env
# 임베딩 설정 (analysis-resume, backend 공통)
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

## 참고 자료

- [Shared Libraries in Microservices](https://openillumi.com/en/en-microservices-shared-library-wise-use/)
- [Code Sharing in Microservices Architecture](https://medium.com/perimeterx/the-case-for-git-submodules-d3dad05187fb)

Content was rephrased for compliance with licensing restrictions.
