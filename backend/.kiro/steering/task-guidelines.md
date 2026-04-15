---
inclusion: fileMatch
fileMatchPattern: "**/tasks/**/*.py"
---

# Celery 태스크 작성 가이드

## 태스크 유형

- 일반 비동기: `BaseTask` 상속
- cron 주기 실행: `BaseScheduledTask` 상속

## 필수 패턴

```python
from common.tasks.base_task import BaseTask
from config.celery import app

class XxxTask(BaseTask):
  def run(self, user_id: int, **kwargs):
    from {앱명}.services import XxxService
    from users.models import User
    user = User.objects.get(id=user_id)
    return XxxService(user=user, **kwargs).perform()

# 반드시 명시적 등록
RegisteredXxxTask = app.register_task(XxxTask())
```

## 핵심 규칙

- `app.register_task()`로 반드시 명시적 등록
- 등록 변수명: `Registered` + 태스크 클래스명
- 태스크 내부에서 Service 호출 (직접 DB 조작 금지)
- `run()` 내부에서 lazy import (순환 참조 방지)
- 주기 태스크: `celery_beat.py`에 등록 필수
