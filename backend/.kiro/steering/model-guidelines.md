---
inclusion: fileMatch
fileMatchPattern: "**/models/**/*.py"
---

# Django 모델 작성 가이드

## 베이스 클래스 선택

| 베이스 클래스 | PK | Soft Delete | 용도 |
|---|---|---|---|
| `BaseModel` | BigAutoField | ✗ | 일반 모델 |
| `BaseModelWithUUID` | UUID | ✗ | 외부 노출 ID 필요 |
| `BaseModelWithSoftDelete` | BigAutoField | ✓ | 논리 삭제 필요 |
| `BaseModelWithUUIDAndSoftDelete` | UUID | ✓ | UUID + 논리 삭제 |

## 필수 규칙

```python
from common.models import BaseModelWithUUID
from django.conf import settings
from django.db import models

class 모델명(BaseModelWithUUID):
  """모델 설명 (한국어)."""

  class Meta(BaseModelWithUUID.Meta):
    db_table = "테이블명_복수형_snake_case"  # 필수
    verbose_name = "한국어 이름"              # 필수
    verbose_name_plural = "한국어 이름 목록"   # 필수

  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="모델_복수형",  # 필수
    verbose_name="사용자",
  )

  def __str__(self):
    return f"모델명 #{self.pk}"
```

## 체크리스트

- db_table: snake_case 복수형
- verbose_name / verbose_name_plural 설정
- ForeignKey에 related_name 필수
- on_delete 정책 적절성 (CASCADE vs SET_NULL)
- enum은 `enums/` 디렉토리에 TextChoices로 정의
- `__init__.py`에 `__all__` export
