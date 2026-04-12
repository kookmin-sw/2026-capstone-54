# MeFit Backend — AI 코드 생성 가이드라인

> 본 문서는 LLM Agent가 MeFit Django 프로젝트의 코드를 생성·검증·리팩토링할 때 따라야 할 아키텍처 규칙, 코딩 컨벤션, 검증 로직을 정리한 가이드라인입니다.
> 실제 Agent/Skill/Hook 구현은 별도로 진행합니다.

---

## 1. 프로젝트 개요

| 항목 | 값 |
|---|---|
| Python | >= 3.12 |
| Django | 6.0+ |
| DRF | 3.16+ |
| DB | PostgreSQL (psqlextra) |
| 비동기 | Celery 5.x + Redis |
| 실시간 | Django Channels (WebSocket / SSE) |
| LLM | LangChain + OpenAI (ChatOpenAI) |
| 패키지 관리 | uv (pyproject.toml) |
| 코드 포맷 | yapf (indent=2), isort (profile=black), flake8 |
| API 문서 | drf-spectacular (OpenAPI 3.0) |
| JSON 직렬화 | CamelCase ↔ snake_case 자동 변환 |

---

## 2. 디렉토리 구조 규칙

### 2.1 도메인 앱 구조 (예: `interviews`)

```
webapp/
├── interviews/                    # 도메인 레이어 (비즈니스 로직)
│   ├── admin/                     # Django Admin 설정
│   ├── enums/                     # TextChoices 열거형
│   ├── factories/                 # Factory Boy 테스트 팩토리
│   ├── migrations/
│   ├── models/                    # Django 모델 (파일당 1모델)
│   ├── schemas/                   # Pydantic 스키마 (LLM I/O 등)
│   ├── services/                  # 비즈니스 서비스 (BaseService 상속)
│   │   └── llm/                   # LLM 관련 서비스 (Generator, Prompt 등)
│   ├── signals/                   # Django Signal 핸들러
│   ├── tasks/                     # Celery 태스크
│   ├── templates/                 # 이메일/Admin 템플릿
│   ├── tests/                     # 테스트 (models/, services/, admin/)
│   ├── apps.py
│   └── constants.py
│
├── api/v1/interviews/             # API 레이어 (표현 계층)
│   ├── serializers/               # DRF Serializer (액션별 분리)
│   ├── views/                     # ViewSet / APIView (파일당 1뷰)
│   ├── tests/                     # API 레이어 테스트
│   ├── consumers.py               # WebSocket / SSE Consumer
│   ├── routing.py                 # ws/sse URL 패턴
│   └── urls.py                    # REST URL 패턴
```

### 2.2 핵심 규칙

- 도메인 앱(`interviews/`)과 API 앱(`api/v1/interviews/`)은 분리한다
- 모델, 뷰, 시리얼라이저는 파일당 1개 클래스 원칙
- `__init__.py`에서 public API를 명시적으로 export (`__all__`)
- enum은 `enums/` 디렉토리에 `TextChoices` 클래스로 정의
- Pydantic 스키마는 `schemas/` 디렉토리에 정의 (LLM I/O, 외부 데이터 정규화용)

---

## 3. 베이스 클래스 체계

### 3.1 모델 (Model)

| 베이스 클래스 | PK | Soft Delete | 용도 |
|---|---|---|---|
| `BaseModel` | BigAutoField | ✗ | 일반 모델 |
| `BaseModelWithUUID` | UUID | ✗ | 외부 노출 ID가 필요한 모델 |
| `BaseModelWithSoftDelete` | BigAutoField | ✓ | 논리 삭제 필요 모델 |
| `BaseModelWithUUIDAndSoftDelete` | UUID | ✓ | UUID + 논리 삭제 |

공통 제공 필드: `created_at`, `updated_at` (+ `deleted_at` for SoftDelete)

```python
# 올바른 모델 정의 예시
from common.models import BaseModelWithUUID

class InterviewSession(BaseModelWithUUID):
    class Meta(BaseModelWithUUID.Meta):
        db_table = "interview_sessions"
        verbose_name = "면접 세션"
        verbose_name_plural = "면접 세션 목록"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, ...)
    # ...
```

### 3.2 서비스 (Service)

| 베이스 클래스 | 트랜잭션 | 용도 |
|---|---|---|
| `BaseService` | `transaction.atomic()` | 쓰기 작업 (생성/수정/삭제) |
| `BaseQueryService` | 없음 | 읽기 전용 조회 |

```python
# 쓰기 서비스 패턴
class CreateResumeService(BaseService):
    required_value_kwargs = ["title", "file"]

    def validate(self):
        # 비즈니스 규칙 검증
        pass

    def execute(self):
        # 실제 로직 (트랜잭션 내부)
        return Resume.objects.create(...)

# 호출
result = CreateResumeService(user=request.user, title="...", file=...).perform()
```

서비스에서 LLM 호출이 필요한 경우, `perform()`을 오버라이드하여 LLM 호출을 트랜잭션 외부에서 수행:

```python
class GenerateInitialQuestionsService(BaseService):
    def perform(self):
        self._validate_kwargs()
        self.validate()
        self._llm_output, self._callback = self._call_llm()  # 트랜잭션 밖
        with transaction.atomic():
            return self.execute()  # DB 저장만 트랜잭션 안
```

### 3.3 뷰 (View)

| 베이스 클래스 | 인증 | 용도 |
|---|---|---|
| `BaseAPIView` | IsAuthenticated | 인증 필수 단일 엔드포인트 |
| `BaseGenericViewSet` | IsAuthenticated | 커스텀 액션 ViewSet |
| `BaseViewSet` | IsAuthenticated | CRUD ModelViewSet |
| `BaseReadOnlyViewSet` | AllowAny | 비인증 읽기 전용 |
| `BaseListAPIView` | AllowAny | 비인증 목록 조회 |

모든 인증 필수 뷰는 `self.current_user`로 현재 사용자에 접근한다.

### 3.4 예외 (Exception)

| 예외 클래스 | HTTP 상태 | error_code |
|---|---|---|
| `ValidationException` | 400 | VALIDATION_ERROR |
| `UnauthorizedException` | 401 | UNAUTHORIZED |
| `PermissionDeniedException` | 403 | PERMISSION_DENIED |
| `NotFoundException` | 404 | NOT_FOUND |
| `ConflictException` | 409 | CONFLICT |
| `RateLimitException` | 429 | RATE_LIMIT_EXCEEDED |
| `ServiceUnavailableException` | 503 | SERVICE_UNAVAILABLE |

```python
# 앱별 예외 정의
class ResumeNotFoundException(NotFoundException):
    error_code = "RESUME_NOT_FOUND"
    default_detail = "이력서를 찾을 수 없습니다."
```

통일된 에러 응답 포맷:
```json
{
  "errorCode": "RESUME_NOT_FOUND",
  "message": "이력서를 찾을 수 없습니다."
}
```

### 3.5 권한 (Permission)

| 클래스 | 조건 |
|---|---|
| `IsAuthenticated` | JWT 인증 |
| `IsEmailVerified` | 이메일 인증 완료 |
| `IsProfileCompleted` | 이메일 인증 + 프로필 작성 완료 |
| `AllowAny` | 비인증 허용 |

### 3.6 Celery 태스크

| 베이스 클래스 | 용도 |
|---|---|
| `BaseTask` | 일반 비동기 태스크 |
| `BaseScheduledTask` | cron 기반 주기 태스크 |

```python
class SendVerificationEmailTask(BaseTask):
    def run(self, user_id: int):
        user = User.objects.get(id=user_id)
        return SendVerificationEmailService(user=user).perform()

# 반드시 명시적 등록
RegisteredSendVerificationEmailTask = app.register_task(SendVerificationEmailTask())
```

### 3.7 WebSocket / SSE Consumer

| 베이스 클래스 | 인증 | 프로토콜 |
|---|---|---|
| `BaseWebSocketConsumer` | 없음 | WebSocket |
| `UserWebSocketConsumer` | 티켓 기반 | WebSocket |
| `SseConsumer` | 없음 | SSE |
| `UserSseConsumer` | JWT Bearer | SSE |

### 3.8 검증기 (Validator)

```python
class MyValidator(BaseValidator):
    @validation_method(priority=10)
    def validate_required_fields(self):
        # priority 높은 순서대로 실행
        ...

    @validation_method(priority=5)
    def validate_relationships(self):
        ...

# 사용
MyValidator(instance=my_model).validate()
```

---

## 4. 코딩 컨벤션

### 4.1 포맷팅 규칙

- 들여쓰기: 2 spaces (yapf 설정)
- 최대 줄 길이: 120자
- import 정렬: isort (profile=black)
- 문자열: 큰따옴표 `"` 사용
- docstring: 한국어, 첫 줄 요약 + 빈 줄 + 상세 설명
- 주석: 한국어

### 4.2 네이밍 규칙

| 대상 | 규칙 | 예시 |
|---|---|---|
| 모델 | PascalCase, 단수형 | `InterviewSession` |
| 서비스 | PascalCase, 동사+명사+Service | `CreateResumeService` |
| 태스크 | PascalCase, 동사+명사+Task | `SendVerificationEmailTask` |
| 등록 태스크 | Registered + 태스크명 | `RegisteredSendVerificationEmailTask` |
| 시리얼라이저 | PascalCase, 모델명+Serializer | `InterviewSessionSerializer` |
| 뷰 | PascalCase, 모델명+ViewSet/View | `InterviewSessionViewSet` |
| 팩토리 | PascalCase, 모델명+Factory | `UserFactory` |
| enum | PascalCase, TextChoices 상속 | `InterviewSessionStatus` |
| DB 테이블 | snake_case, 복수형 | `interview_sessions` |
| URL 경로 | kebab-case | `interview-sessions` |
| API 필드 (응답) | camelCase (자동 변환) | `interviewSessionType` |
| Python 필드 | snake_case | `interview_session_type` |

### 4.3 import 규칙

```python
# 1. 표준 라이브러리
import json
from datetime import timedelta

# 2. 서드파티
from django.db import models
from rest_framework import serializers

# 3. 프로젝트 내부 (절대 경로)
from common.models import BaseModel
from interviews.services import CreateInterviewSessionService
```

### 4.4 Serializer 규칙

- 액션별 Serializer 분리: `CreateXxxSerializer`, `XxxSerializer`, `XxxListSerializer`
- `read_only_fields`를 명시적으로 선언
- ViewSet에서 `get_serializer_class()`로 액션별 분기

```python
def get_serializer_class(self):
    if self.action == "create":
        return CreateInterviewSessionSerializer
    if self.action == "list":
        return InterviewSessionListSerializer
    return InterviewSessionSerializer
```

### 4.5 QuerySet 최적화 규칙

- `select_related()`: ForeignKey, OneToOneField
- `prefetch_related()` + `Prefetch()`: ManyToMany, 역참조
- N+1 쿼리 방지 필수 (nplusone 모니터링 활성화)

---

## 5. LLM 서비스 패턴

### 5.1 아키텍처

```
서비스 (GenerateInitialQuestionsService)
  ├── LLM 클라이언트 (common.llm_client.get_llm)
  ├── Generator (QuestionGenerator 서브클래스)
  │   ├── PromptRegistry (난이도별 프롬프트)
  │   └── Structured Output (Pydantic 스키마)
  ├── TokenUsageCallback (토큰 추적)
  └── TokenUsage.log() (DB 기록)
```

### 5.2 핵심 규칙

1. LLM 호출은 반드시 트랜잭션 외부에서 수행
2. I/O 스키마는 Pydantic `BaseModel`로 정의 (`schemas/` 디렉토리)
3. `get_llm()` 팩토리를 통해 LLM 인스턴스 생성 (직접 생성 금지)
4. `TokenUsageCallback`으로 토큰 사용량 추적, `TokenUsage.log()`로 DB 기록
5. 프롬프트는 `PromptRegistry` 패턴으로 중앙 관리
6. LangChain `with_structured_output()`으로 타입 안전한 응답 파싱

---

## 6. 테스트 패턴

### 6.1 구조

```
앱/tests/
├── models/          # 모델 단위 테스트
├── services/        # 서비스 단위 테스트
├── admin/           # Admin 테스트
└── properties/      # Hypothesis 속성 기반 테스트

api/v1/앱/tests/
├── serializers/     # Serializer 테스트
└── views/           # API 통합 테스트
```

### 6.2 규칙

- `django.test.TestCase` 사용 (트랜잭션 자동 롤백)
- Factory Boy로 테스트 데이터 생성 (`UserFactory`, `InterviewSessionFactory` 등)
- 외부 의존성(LLM, S3, Celery)은 `unittest.mock.patch`로 모킹
- 테스트 메서드명: 한국어 서술형 (`test_이력서_생성`, `test_celery_태스크_발행`)
- Hypothesis로 속성 기반 테스트 작성 가능

```python
class CreateFileResumeServiceTests(TestCase):
    def setUp(self):
        self.user = UserFactory()

    @patch("resumes.services.mixins.resume_pipeline_mixin.current_app.send_task")
    def test_이력서_생성(self, mock_send_task):
        resume = CreateFileResumeService(
            user=self.user, title="파일 이력서", file=self.pdf_file,
        ).perform()
        self.assertIsNotNone(resume.pk)
```

---

## 7. 설정 구조

### 7.1 Settings 컴포넌트 분리

```
config/settings/
├── base.py                    # 공통 (모든 컴포넌트 import)
├── development.py             # 개발 환경
├── production.py              # 운영 환경
├── test.py                    # 테스트 환경
└── components/
    ├── auth.py                # 인증, JWT, 이메일
    ├── cache.py               # Redis 캐시
    ├── celery.py              # Celery 브로커
    ├── celery_beat.py         # 주기 태스크 스케줄
    ├── channel_layer.py       # Channels Redis
    ├── database.py            # PostgreSQL
    ├── installed_app.py       # INSTALLED_APPS
    ├── logging.py             # structlog, drf-api-logger
    ├── middleware.py           # 미들웨어 스택
    ├── rest_framework.py      # DRF, Spectacular
    └── ...
```

### 7.2 환경 변수

- `django-environ`으로 `.env` 파일에서 로드
- 민감 정보(DB 비밀번호, API 키 등)는 반드시 환경 변수로 관리
- `ATOMIC_REQUESTS = True` (모든 HTTP 요청이 트랜잭션)

---

## 8. Agent 설계 계획

### 8.1 Agent 역할 정의

| Agent | 역할 | 트리거 |
|---|---|---|
| Code Generator Agent | 새 기능 코드 생성 (모델, 서비스, 뷰, 시리얼라이저 등) | 사용자 요청 |
| Architecture Validator Agent | 생성된 코드의 아키텍처 규칙 준수 여부 검증 | 코드 생성 후 자동 |
| Code Quality Agent | 포맷팅, 린트, 타입 검사 | 파일 저장 시 |
| Test Generator Agent | 서비스/뷰 테스트 코드 자동 생성 | 사용자 요청 |
| Migration Safety Agent | 마이그레이션 파일 안전성 검증 | 마이그레이션 생성 후 |

### 8.2 Code Generator Agent — Skill 목록

#### Skill 1: 도메인 앱 생성

입력: 앱 이름, 모델 정의 (필드, 관계)
출력:
- `앱/models/모델명.py` — BaseModel 계열 상속
- `앱/enums/열거형.py` — TextChoices
- `앱/admin/모델명_admin.py` — Unfold Admin
- `앱/factories/모델명_factory.py` — Factory Boy
- `앱/__init__.py`, `앱/apps.py`
- `config/settings/components/installed_app.py` 업데이트

#### Skill 2: 서비스 생성

입력: 서비스 유형 (쓰기/읽기), 비즈니스 로직 설명
출력:
- `앱/services/서비스명.py` — BaseService 또는 BaseQueryService 상속
- `required_kwargs` / `required_value_kwargs` 자동 설정
- `validate()` + `execute()` 구현

#### Skill 3: API 엔드포인트 생성

입력: HTTP 메서드, URL 패턴, 요청/응답 스키마
출력:
- `api/v1/앱/views/뷰명.py` — 적절한 베이스 클래스 상속
- `api/v1/앱/serializers/시리얼라이저명.py`
- `api/v1/앱/urls.py` 업데이트
- `@extend_schema` 데코레이터 포함

#### Skill 4: Celery 태스크 생성

입력: 태스크 유형 (일반/주기), 실행 로직
출력:
- `앱/tasks/태스크명.py` — BaseTask 또는 BaseScheduledTask 상속
- `RegisteredXxxTask = app.register_task(XxxTask())`
- 주기 태스크의 경우 `celery_beat.py` 업데이트

#### Skill 5: WebSocket/SSE Consumer 생성

입력: 프로토콜 (ws/sse), 인증 여부, 이벤트 스키마
출력:
- `api/v1/앱/consumers.py` — 적절한 베이스 Consumer 상속
- `api/v1/앱/routing.py` — URL 패턴
- `config/asgi.py` 업데이트
- `@sse_consumer` / `@ws_consumer` 데코레이터 적용

#### Skill 6: LLM 서비스 생성

입력: 프롬프트 설명, I/O 스키마 정의
출력:
- `앱/schemas/입력_스키마.py` — Pydantic BaseModel
- `앱/schemas/출력_스키마.py` — Pydantic BaseModel
- `앱/services/llm/생성기.py` — QuestionGenerator 패턴 참고
- `앱/services/llm/prompt_registry.py` 업데이트 (필요 시)
- TokenUsage 기록 로직 포함

### 8.3 Architecture Validator Agent — 검증 체크리스트

#### 구조 검증

- [ ] 도메인 앱과 API 앱이 분리되어 있는가
- [ ] 파일당 1개 클래스 원칙을 준수하는가
- [ ] `__init__.py`에 `__all__` export가 정의되어 있는가
- [ ] 디렉토리 구조가 표준 패턴을 따르는가

#### 모델 검증

- [ ] 적절한 BaseModel 계열을 상속하는가
- [ ] `class Meta`에 `db_table`, `verbose_name`이 정의되어 있는가
- [ ] ForeignKey에 `related_name`이 명시되어 있는가
- [ ] `on_delete` 정책이 적절한가 (CASCADE vs SET_NULL)
- [ ] 인덱스가 필요한 필드에 인덱스가 설정되어 있는가

#### 서비스 검증

- [ ] BaseService 또는 BaseQueryService를 상속하는가
- [ ] `required_kwargs` / `required_value_kwargs`가 적절히 설정되어 있는가
- [ ] `execute()` 메서드가 구현되어 있는가
- [ ] 읽기 전용 로직에 BaseQueryService를 사용하는가
- [ ] LLM 호출이 트랜잭션 외부에서 수행되는가

#### 뷰 검증

- [ ] 적절한 베이스 뷰를 상속하는가
- [ ] `permission_classes`가 명시되어 있는가
- [ ] `@extend_schema` 데코레이터가 적용되어 있는가
- [ ] 비즈니스 로직이 뷰에 직접 작성되지 않고 서비스를 호출하는가
- [ ] `get_serializer_class()`로 액션별 Serializer를 분기하는가

#### 시리얼라이저 검증

- [ ] `read_only_fields`가 명시되어 있는가
- [ ] 액션별로 적절히 분리되어 있는가 (Create, List, Detail)
- [ ] 중첩 시리얼라이저 사용 시 N+1 쿼리를 유발하지 않는가

#### 태스크 검증

- [ ] BaseTask 또는 BaseScheduledTask를 상속하는가
- [ ] `app.register_task()`로 명시적 등록이 되어 있는가
- [ ] 태스크 내부에서 Service를 호출하는가 (직접 DB 조작 금지)
- [ ] 주기 태스크의 경우 `celery_beat.py`에 등록되어 있는가

#### 예외 검증

- [ ] 커스텀 예외가 BaseException 계열을 상속하는가
- [ ] `error_code`와 `default_detail`이 정의되어 있는가
- [ ] 적절한 HTTP 상태 코드를 사용하는가

#### QuerySet 검증

- [ ] `select_related()`가 ForeignKey 접근 시 사용되는가
- [ ] `prefetch_related()`가 역참조/M2M 접근 시 사용되는가
- [ ] 불필요한 전체 조회(`all()`)가 없는가

### 8.4 Code Quality Agent — 자동 검증 항목

```yaml
# Hook: 파일 저장 시 자동 실행
triggers:
  - fileEdited: "**/*.py"

checks:
  - yapf 포맷팅 검증 (indent=2, line_length=120)
  - isort import 정렬 검증
  - flake8 린트 검증
  - getDiagnostics 타입/구문 오류 검증
```

### 8.5 Test Generator Agent — 생성 규칙

서비스 테스트 생성 시:
1. `setUp()`에서 Factory로 테스트 데이터 생성
2. 정상 케이스 + 예외 케이스 모두 작성
3. 외부 의존성은 `@patch`로 모킹
4. 테스트 메서드명은 한국어 서술형
5. `django.test.TestCase` 사용

뷰 테스트 생성 시:
1. JWT 인증 토큰 설정
2. HTTP 메서드별 테스트
3. 권한 검증 테스트 (비인증, 미인증 이메일 등)
4. 응답 상태 코드 + 응답 바디 검증

---

## 9. Steering 파일 계획

### 9.1 항상 포함 (Always Included)

```markdown
# .kiro/steering/django-conventions.md
---
inclusion: always
---
# Django 코딩 컨벤션
- 들여쓰기 2 spaces
- BaseService/BaseQueryService 패턴 준수
- 파일당 1 클래스
- ...
```

### 9.2 조건부 포함 (File Match)

```markdown
# .kiro/steering/model-guidelines.md
---
inclusion: fileMatch
fileMatchPattern: "**/models/**/*.py"
---
# 모델 작성 가이드
- BaseModel 계열 상속 필수
- db_table, verbose_name 필수
- ...
```

```markdown
# .kiro/steering/service-guidelines.md
---
inclusion: fileMatch
fileMatchPattern: "**/services/**/*.py"
---
# 서비스 작성 가이드
- BaseService 또는 BaseQueryService 상속
- required_kwargs 설정
- ...
```

```markdown
# .kiro/steering/serializer-guidelines.md
---
inclusion: fileMatch
fileMatchPattern: "**/serializers/**/*.py"
---
# Serializer 작성 가이드
- 액션별 분리
- read_only_fields 명시
- ...
```

```markdown
# .kiro/steering/test-guidelines.md
---
inclusion: fileMatch
fileMatchPattern: "**/tests/**/*.py"
---
# 테스트 작성 가이드
- Factory Boy 사용
- 한국어 메서드명
- ...
```

---

## 10. Hook 계획

### 10.1 코드 품질 Hook

| Hook | 이벤트 | 액션 | 설명 |
|---|---|---|---|
| lint-on-save | fileEdited (`*.py`) | runCommand | `yapf + isort + flake8` 실행 |
| architecture-check | postToolUse (write) | askAgent | 아키텍처 규칙 준수 검증 |
| test-after-task | postTaskExecution | runCommand | `pytest` 관련 테스트 실행 |

### 10.2 안전성 Hook

| Hook | 이벤트 | 액션 | 설명 |
|---|---|---|---|
| migration-review | fileCreated (`*/migrations/*.py`) | askAgent | 마이그레이션 안전성 검토 |
| env-protection | preToolUse (write) | askAgent | `.env` 파일 수정 방지 |

---

## 11. 실행 계획 (로드맵)

### Phase 1: 기반 구축
1. Steering 파일 작성 (django-conventions, model/service/serializer/test guidelines)
2. 기본 Hook 설정 (lint-on-save, architecture-check)

### Phase 2: Agent Skill 구현
3. Code Generator Agent의 Skill 1~4 구현 (모델, 서비스, API, 태스크)
4. Architecture Validator Agent 체크리스트 구현

### Phase 3: 고급 기능
5. LLM 서비스 생성 Skill 구현
6. WebSocket/SSE Consumer 생성 Skill 구현
7. Test Generator Agent 구현

### Phase 4: 자동화 강화
8. Migration Safety Agent 구현
9. Code Quality Agent 고도화 (커스텀 린트 규칙)
10. CI/CD 연동 Hook 추가

---

## 부록 A: 주요 의존성 요약

| 패키지 | 용도 |
|---|---|
| `django-environ` | 환경 변수 관리 |
| `djangorestframework-simplejwt` | JWT 인증 |
| `djangorestframework-camel-case` | CamelCase 자동 변환 |
| `drf-spectacular` | OpenAPI 문서 생성 |
| `django-filter` | QuerySet 필터링 |
| `django-postgres-extra` | PostgreSQL 고급 기능 |
| `channels` + `channels-redis` | WebSocket / SSE |
| `celery` + `django-celery-beat` | 비동기 태스크 + 스케줄링 |
| `django-structlog` + `django-guid` | 구조화 로깅 + Correlation ID |
| `drf-api-logger` | API 요청/응답 DB 기록 |
| `langchain` + `langchain-openai` | LLM 통합 |
| `pydantic` | 데이터 스키마 검증 |
| `factory-boy` | 테스트 팩토리 |
| `hypothesis` | 속성 기반 테스트 |
| `nplusone` | N+1 쿼리 감지 |
| `django-unfold` | Admin UI |
| `django-storages` + `boto3` | S3 파일 스토리지 |
| `pgvector` | 벡터 검색 (이력서 임베딩) |

## 부록 B: API 응답 포맷

### 성공 응답 (단건)
```json
{
  "uuid": "...",
  "interviewSessionType": "followup",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### 성공 응답 (목록 — 페이지네이션)
```json
{
  "count": 100,
  "totalPagesCount": 10,
  "nextPage": 2,
  "previousPage": null,
  "results": [...]
}
```

### 에러 응답
```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "입력값이 올바르지 않습니다.",
  "fieldErrors": {
    "title": ["이 필드는 필수입니다."]
  }
}
```

## 부록 C: 실시간 통신 패턴

### WebSocket 연결 흐름
```
1. POST /api/v1/realtime/ws-ticket/ → {"ticket": "<ticket>"}
2. ws://host/ws/interviews/{session_uuid}/?ticket=<ticket>
3. 서버: 티켓 검증 → 1회용 삭제 → 그룹 참가
4. 외부 push: channel_layer.group_send("user_{id}", {"type": "user.message", ...})
```

### SSE 연결 흐름
```
1. GET /sse/interviews/{uuid}/report-status/
   Headers: Authorization: Bearer <access_token>
2. 서버: JWT 검증 → 그룹 참가 → 이벤트 스트림 시작
3. 외부 push: channel_layer.group_send("user_{id}", {"type": "sse.push", ...})
```
