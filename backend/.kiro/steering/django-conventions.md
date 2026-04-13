---
inclusion: auto
---

# MeFit Django 코딩 컨벤션

## 필수 규칙

- 들여쓰기: 2 spaces (yapf 설정)
- 최대 줄 길이: 120자
- import 정렬: isort (profile=black, line_length=120)
- 문자열: 큰따옴표 `"` 사용
- docstring/주석: 한국어
- 테스트 메서드명: 한국어 서술형 (`test_이력서_생성`)

## 아키텍처 원칙

- 도메인 앱(`webapp/앱명/`)과 API 앱(`webapp/api/v1/앱명/`)은 반드시 분리
- 파일당 1개 클래스 원칙
- `__init__.py`에 `__all__` export 필수
- 비즈니스 로직은 서비스 레이어에 작성 (뷰에 직접 작성 금지)
- LLM 호출은 반드시 트랜잭션 외부에서 수행

## 베이스 클래스 사용

- 모델: `BaseModel`, `BaseModelWithUUID`, `BaseModelWithSoftDelete`, `BaseModelWithUUIDAndSoftDelete`
- 서비스: `BaseService` (쓰기, 트랜잭션), `BaseQueryService` (읽기, 트랜잭션 없음)
- 뷰: `BaseAPIView`, `BaseGenericViewSet`, `BaseViewSet`, `BaseReadOnlyViewSet`, `BaseListAPIView`
- 예외: `ValidationException`, `NotFoundException`, `PermissionDeniedException`, `ConflictException` 등
- 태스크: `BaseTask`, `BaseScheduledTask` + `app.register_task()` 명시적 등록

## QuerySet 최적화

- ForeignKey 접근 시 `select_related()` 필수
- 역참조/M2M 접근 시 `prefetch_related()` + `Prefetch()` 필수
- N+1 쿼리 방지 필수

## 상세 가이드라인

#[[file:docs/ai-code-generation-guidelines.md]]
