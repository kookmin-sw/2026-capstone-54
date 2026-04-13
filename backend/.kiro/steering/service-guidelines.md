---
inclusion: fileMatch
fileMatchPattern: "**/services/**/*.py"
---

# Django 서비스 작성 가이드

## 서비스 유형

- 쓰기 (생성/수정/삭제): `BaseService` 상속 → `transaction.atomic()` 내 실행
- 읽기 전용: `BaseQueryService` 상속 → 트랜잭션 없음

## 필수 패턴

```python
from common.services import BaseService

class CreateXxxService(BaseService):
  required_value_kwargs = ["title"]  # None 불허 필수 인자

  def validate(self):
    """비즈니스 규칙 검증. 필요 시 오버라이드."""
    pass

  def execute(self):
    """실제 로직. 반드시 구현."""
    return 모델.objects.create(user=self.user, title=self.kwargs["title"])
```

## LLM 호출 서비스

LLM 호출은 반드시 트랜잭션 외부에서 수행:

```python
def perform(self):
  self._validate_kwargs()
  self.validate()
  self._llm_result = self._call_llm()  # 트랜잭션 밖
  with transaction.atomic():
    return self.execute()  # DB 저장만 트랜잭션 안
```

## 체크리스트

- BaseService vs BaseQueryService 적절한 선택
- required_kwargs / required_value_kwargs 설정
- validate() + execute() 구현
- LLM 호출 시 트랜잭션 분리
- `__init__.py`에 `__all__` export
- 뷰에서 `.perform()`으로 호출
