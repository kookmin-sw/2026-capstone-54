# MeFit Backend — Django 프로젝트

## 프로젝트 개요

Django 6.0+ / DRF 3.16+ 기반 면접 준비 플랫폼 백엔드.
Python >= 3.12, PostgreSQL, Redis, Celery, Django Channels (WebSocket/SSE), LangChain + OpenAI.

## 빌드 & 테스트 명령어

```bash
# 패키지 설치
uv sync

# 전체 테스트
bash environments/development/commands/08-test.sh

# 특정 앱 테스트
bash environments/development/commands/08-test.sh interviews.tests --keepdb

# 마이그레이션
uv run python webapp/manage.py makemigrations
uv run python webapp/manage.py migrate

# 린트 (pre-commit)
uv run pre-commit run --all-files
```

## 코딩 컨벤션

- **들여쓰기: 2 spaces** (yapf 강제, PEP 8 4-space가 아님. 반드시 2칸 들여쓰기 사용)
- 최대 줄 길이: 120자
- import 정렬: isort (profile=black)
- 문자열: 큰따옴표 `"`
- docstring/주석: 한국어
- 테스트 식별자(함수/클래스/변수)는 영어 snake_case, docstring 은 한국어 (상세: `docs/testing-conventions.md`)

## 아키텍처 규칙

### 디렉토리 분리
- 도메인 앱: `webapp/앱명/` (models, services, enums, factories, tasks, signals)
- API 앱: `webapp/api/v1/앱명/` (views, serializers, urls, consumers, routing)
- 파일당 1개 클래스 원칙
- `__init__.py`에 `__all__` export 필수

### 모델
- `BaseModel` (BigAutoField), `BaseModelWithUUID` (UUID PK), `BaseModelWithSoftDelete`, `BaseModelWithUUIDAndSoftDelete` 중 적절한 것 상속
- `class Meta`에 `db_table` (snake_case 복수형), `verbose_name` 필수
- ForeignKey에 `related_name` 필수

### 서비스
- 쓰기: `BaseService` 상속 → `validate()` + `execute()` (트랜잭션 내)
- 읽기: `BaseQueryService` 상속 → `validate()` + `execute()` (트랜잭션 없음)
- `required_kwargs` / `required_value_kwargs`로 입력 검증
- LLM 호출은 반드시 트랜잭션 외부에서 수행

### 뷰
- 인증 필수: `BaseAPIView`, `BaseGenericViewSet`, `BaseViewSet`
- 비인증: `BaseReadOnlyViewSet`, `BaseListAPIView`
- `self.current_user`로 현재 사용자 접근
- `@extend_schema` 데코레이터 필수
- 비즈니스 로직은 서비스에 위임 (뷰에 직접 작성 금지)

### 시리얼라이저
- 액션별 분리: `CreateXxxSerializer`, `XxxSerializer`, `XxxListSerializer`
- `read_only_fields` 명시
- `get_serializer_class()`로 액션별 분기

### 예외
- `BaseException` 계열 상속: `ValidationException`(400), `UnauthorizedException`(401), `PermissionDeniedException`(403), `NotFoundException`(404), `ConflictException`(409)
- `error_code` + `default_detail` 정의

### 권한
- `IsAuthenticated`, `IsEmailVerified`, `IsProfileCompleted`, `AllowAny`

### Celery 태스크
- `BaseTask` 또는 `BaseScheduledTask` 상속
- `RegisteredXxxTask = app.register_task(XxxTask())` 명시적 등록
- 태스크 내부에서 Service 호출 (직접 DB 조작 금지)

### WebSocket / SSE
- WS: `UserWebSocketConsumer` (티켓 인증), `BaseWebSocketConsumer`
- SSE: `UserSseConsumer` (JWT Bearer), `SseConsumer`
- `@sse_consumer` / `@ws_consumer` 데코레이터로 문서화

### LLM 서비스
- `get_llm()` 팩토리로 인스턴스 생성
- Pydantic 스키마로 I/O 정의 (`schemas/` 디렉토리)
- `TokenUsageCallback`으로 토큰 추적 → `TokenUsage.log()` DB 기록
- 프롬프트는 `PromptRegistry` 패턴으로 중앙 관리

### QuerySet 최적화
- `select_related()`: ForeignKey, OneToOneField
- `prefetch_related()` + `Prefetch()`: ManyToMany, 역참조
- N+1 쿼리 방지 필수

## 테스트 규칙
- `django.test.TestCase` 사용
- Factory Boy로 테스트 데이터 생성
- 외부 의존성은 `@patch`로 모킹
- 정상 + 예외 케이스 모두 작성
- **식별자(메서드/클래스/변수)는 영어 snake_case, docstring 만 한국어**
- 상세: `docs/testing-conventions.md`

## 참조 문서
- 상세 가이드라인: `docs/ai-code-generation-guidelines.md`
- 테스트 코드 규칙: `docs/testing-conventions.md`
