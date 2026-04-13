---
name: review-architecture
description: 코드의 아키텍처 규칙 준수 여부를 검증합니다. 코드 리뷰, 아키텍처 검증, 규칙 확인, 코드 검사 등의 요청 시 사용합니다. MeFit 프로젝트의 디렉토리 구조, 베이스 클래스 상속, 네이밍 규칙 등을 체크합니다.
---

# 아키텍처 검증 Skill

## 목적
생성되거나 수정된 코드가 MeFit 프로젝트의 아키텍처 규칙을 준수하는지 검증한다.

## 검증 항목

### 구조 검증
- 도메인 앱(`webapp/앱명/`)과 API 앱(`webapp/api/v1/앱명/`)이 분리되어 있는가
- 파일당 1개 클래스 원칙을 준수하는가
- `__init__.py`에 `__all__` export가 정의되어 있는가
- 디렉토리 구조가 표준 패턴(models/, services/, enums/, factories/, tests/)을 따르는가

### 모델 검증
- 적절한 BaseModel 계열을 상속하는가
- `class Meta`에 `db_table` (snake_case 복수형), `verbose_name`이 정의되어 있는가
- ForeignKey에 `related_name`이 명시되어 있는가
- `on_delete` 정책이 적절한가
- enum은 `TextChoices`로 정의되어 있는가

### 서비스 검증
- BaseService 또는 BaseQueryService를 상속하는가
- `required_kwargs` / `required_value_kwargs`가 설정되어 있는가
- `execute()` 메서드가 구현되어 있는가
- 읽기 전용 로직에 BaseQueryService를 사용하는가
- LLM 호출이 트랜잭션 외부에서 수행되는가

### 뷰 검증
- 적절한 베이스 뷰를 상속하는가
- `permission_classes`가 명시되어 있는가
- `@extend_schema` 데코레이터가 적용되어 있는가
- 비즈니스 로직이 서비스에 위임되어 있는가 (뷰에 직접 작성 금지)
- `get_serializer_class()`로 액션별 분기하는가

### 시리얼라이저 검증
- `read_only_fields`가 명시되어 있는가
- 액션별로 분리되어 있는가 (Create, List, Detail)

### 태스크 검증
- BaseTask 또는 BaseScheduledTask를 상속하는가
- `app.register_task()`로 명시적 등록이 되어 있는가
- 태스크 내부에서 Service를 호출하는가 (직접 DB 조작 금지)

### QuerySet 검증
- `select_related()`가 ForeignKey 접근 시 사용되는가
- `prefetch_related()`가 역참조/M2M 접근 시 사용되는가

### 코딩 컨벤션 검증
- 들여쓰기 2 spaces
- 최대 줄 길이 120자
- docstring/주석 한국어
- 네이밍 규칙 준수 (PascalCase 클래스, snake_case 변수/함수)

## 출력 형식

각 위반 사항을 다음 형식으로 보고:

```
[심각도] 파일:줄번호 — 설명
  수정 제안: ...
```

심각도:
- CRITICAL: 반드시 수정 (아키텍처 위반, 보안 문제)
- MAJOR: 수정 권장 (성능, 유지보수성)
- MINOR: 개선 권장 (스타일, 컨벤션)
