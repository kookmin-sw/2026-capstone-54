---
name: create-django-service
description: Django 서비스 레이어 클래스를 생성합니다. 비즈니스 로직 작성, 서비스 생성, CRUD 로직 구현 등의 요청 시 사용합니다. BaseService(쓰기) 또는 BaseQueryService(읽기) 패턴을 적용합니다.
---

# Django 서비스 생성 Skill

## 목적
MeFit 프로젝트의 서비스 레이어 패턴에 맞는 서비스 클래스를 생성한다.

## 절차

### 1. 서비스 유형 결정
- 쓰기 (생성/수정/삭제) → `BaseService` (트랜잭션 내 실행)
- 읽기 전용 → `BaseQueryService` (트랜잭션 없음)

### 2. 쓰기 서비스 템플릿

위치: `webapp/{앱명}/services/{서비스명_snake_case}.py`

```python
"""서비스 설명 (한국어)."""

from common.services import BaseService


class Create모델Service(BaseService):
  """서비스 설명 (한국어)."""

  # 키 존재만 검증 (None 허용)
  required_kwargs: list[str] = []
  # 키 존재 + None이 아닌 값 검증
  required_value_kwargs: list[str] = ["title"]

  def validate(self):
    """비즈니스 규칙 검증."""
    # 예: 최대 개수 제한
    if self.user.모델_복수형.count() >= 5:
      raise ValidationException("최대 5개까지 등록 가능합니다.")

  def execute(self):
    """실제 비즈니스 로직. 트랜잭션 내에서 실행된다."""
    return 모델.objects.create(
      user=self.user,
      title=self.kwargs["title"],
    )
```

### 3. 읽기 서비스 템플릿

```python
"""서비스 설명 (한국어)."""

from common.services import BaseQueryService


class Get모델QueryService(BaseQueryService):
  """서비스 설명 (한국어)."""

  required_value_kwargs: list[str] = ["모델_id"]

  def execute(self):
    return 모델.objects.filter(
      user=self.user,
      id=self.kwargs["모델_id"],
    ).select_related("관련모델").first()
```

### 4. LLM 호출이 필요한 서비스

```python
class GenerateXxxService(BaseService):
  """LLM 호출 + DB 저장 서비스."""

  def perform(self):
    """LLM 호출은 트랜잭션 밖, DB 저장만 트랜잭션 안."""
    self._validate_kwargs()
    self.validate()
    self._llm_result = self._call_llm()  # 트랜잭션 밖
    with transaction.atomic():
      return self.execute()  # DB 저장

  def _call_llm(self):
    llm = get_llm()
    callback = TokenUsageCallback()
    llm = llm.with_config(callbacks=[callback])
    # ... LLM 호출
    return result, callback

  def execute(self):
    # DB 저장 로직
    pass
```

### 5. __init__.py 업데이트
`webapp/{앱명}/services/__init__.py`에 import + `__all__` 추가.

### 6. 호출 패턴

```python
# 뷰에서 호출
result = CreateResumeService(
  user=request.user,
  title="백엔드 개발자",
).perform()
```

## 체크리스트
- [ ] 적절한 베이스 클래스 상속 (BaseService vs BaseQueryService)
- [ ] required_kwargs / required_value_kwargs 설정
- [ ] validate() 비즈니스 규칙 검증 구현
- [ ] execute() 구현
- [ ] LLM 호출 시 트랜잭션 외부 실행
- [ ] __init__.py에 __all__ export
- [ ] 뷰에서 서비스 호출 (뷰에 직접 로직 금지)
