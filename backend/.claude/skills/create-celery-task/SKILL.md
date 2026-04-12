---
name: create-celery-task
description: Celery 비동기 태스크를 생성합니다. 비동기 작업, 백그라운드 태스크, 주기 태스크, 스케줄 작업 등의 요청 시 사용합니다. BaseTask 또는 BaseScheduledTask를 상속하고 명시적 등록 패턴을 적용합니다.
---

# Celery 태스크 생성 Skill

## 목적
MeFit 프로젝트 규칙에 맞는 Celery 태스크를 생성한다.

## 절차

### 1. 태스크 유형 결정
- 일반 비동기 → `BaseTask`
- cron 주기 실행 → `BaseScheduledTask`

### 2. 일반 태스크 템플릿

위치: `webapp/{앱명}/tasks/{태스크명_snake_case}.py`

```python
"""태스크 설명 (한국어)."""

from common.tasks.base_task import BaseTask
from config.celery import app


class XxxTask(BaseTask):
  """태스크 설명 (한국어)."""

  def run(self, user_id: int, **kwargs):
    from {앱명}.models import 모델
    from {앱명}.services import XxxService

    user = 모델.objects.get(id=user_id)
    return XxxService(user=user, **kwargs).perform()


# 반드시 명시적 등록
RegisteredXxxTask = app.register_task(XxxTask())
```

### 3. 주기 태스크 템플릿

```python
"""주기 태스크 설명 (한국어)."""

from celery.schedules import crontab
from common.tasks.base_scheduled_task import BaseScheduledTask
from config.celery import app


class DailyXxxTask(BaseScheduledTask):
  """매일 실행되는 태스크."""

  schedule = crontab(hour=15, minute=0)  # KST 00:00 = UTC 15:00

  def run(self):
    from {앱명}.services import XxxService
    return XxxService().perform()


RegisteredDailyXxxTask = app.register_task(DailyXxxTask())
```

### 4. celery_beat.py 등록 (주기 태스크만)

`webapp/config/settings/components/celery_beat.py`에 추가:

```python
CELERY_BEAT_SCHEDULE = {
  # ... 기존 항목 ...
  "{앱명}.tasks.xxx_task.RegisteredDailyXxxTask": {
    "task": "{앱명}.tasks.xxx_task.RegisteredDailyXxxTask",
    "schedule": crontab(hour=15, minute=0),
    "args": (),
    "kwargs": {},
    "options": {},
  },
}
```

### 5. __init__.py 업데이트

### 6. 호출 패턴

```python
# 비동기 실행
RegisteredXxxTask.delay(user_id=1)

# 지연 실행
RegisteredXxxTask.apply_async(kwargs={"user_id": 1}, countdown=10)
```

## 핵심 규칙
- 태스크 내부에서 Service를 호출한다 (직접 DB 조작 금지)
- import는 run() 내부에서 lazy import (순환 참조 방지)
- `app.register_task()`로 반드시 명시적 등록
- 등록 변수명: `Registered` + 태스크 클래스명

## 체크리스트
- [ ] BaseTask 또는 BaseScheduledTask 상속
- [ ] app.register_task() 명시적 등록
- [ ] Registered 접두사 변수명
- [ ] run() 내부에서 Service 호출
- [ ] lazy import 사용
- [ ] 주기 태스크: celery_beat.py 등록
