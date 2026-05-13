---
name: create-django-model
description: Django 모델을 생성합니다. 모델 생성, 새 모델 만들기, 테이블 추가, 엔티티 정의 등의 요청 시 사용합니다. MeFit 프로젝트의 BaseModel 계열을 상속하고 db_table, verbose_name, related_name 등 필수 규칙을 적용합니다.
---

# Django 모델 생성 Skill

## 목적
MeFit 프로젝트 규칙에 맞는 Django 모델을 생성한다.

## 절차

### 1. 베이스 클래스 선택
- 일반 모델 → `BaseModel` (BigAutoField PK)
- 외부 노출 ID 필요 → `BaseModelWithUUID` (UUID PK)
- 논리 삭제 필요 → `BaseModelWithSoftDelete`
- UUID + 논리 삭제 → `BaseModelWithUUIDAndSoftDelete`

### 2. 모델 파일 생성
위치: `webapp/{앱명}/models/{모델명_snake_case}.py`

```python
"""모델 설명 (한국어)."""

from common.models import BaseModelWithUUID  # 적절한 베이스 선택
from django.conf import settings
from django.db import models


class 모델명(BaseModelWithUUID):
  """모델 설명 (한국어)."""

  class Meta(BaseModelWithUUID.Meta):
    db_table = "테이블명_복수형_snake_case"
    verbose_name = "한국어 이름"
    verbose_name_plural = "한국어 이름 목록"

  # ForeignKey에는 반드시 related_name 지정
  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="모델_복수형",
    verbose_name="사용자",
  )

  def __str__(self):
    return f"모델명 #{self.pk}"
```

### 3. __init__.py 업데이트
`webapp/{앱명}/models/__init__.py`에 import + `__all__` 추가.

### 4. enum 정의 (필요 시)
위치: `webapp/{앱명}/enums/{enum명_snake_case}.py`

```python
from django.db import models

class 상태Enum(models.TextChoices):
  ACTIVE = "active", "활성"
  INACTIVE = "inactive", "비활성"
```

### 5. Admin 등록
위치: `webapp/{앱명}/admin/{모델명_snake_case}_admin.py`

### 6. Factory 생성
위치: `webapp/{앱명}/factories/{모델명_snake_case}_factory.py`

```python
import factory
from factory.django import DjangoModelFactory

class 모델명Factory(DjangoModelFactory):
  class Meta:
    model = 모델명
```

## 체크리스트
- [ ] 적절한 BaseModel 계열 상속
- [ ] db_table (snake_case 복수형) 설정
- [ ] verbose_name / verbose_name_plural 설정
- [ ] ForeignKey에 related_name 설정
- [ ] on_delete 정책 적절성 확인
- [ ] __init__.py에 __all__ export
- [ ] enum은 TextChoices로 정의
- [ ] Factory 생성
