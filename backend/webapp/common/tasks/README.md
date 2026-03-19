# Common Tasks

Celery 비동기 태스크 추상화 레이어.

각 앱의 태스크는 이 모듈의 베이스 클래스를 상속받아 구현한다.
태스크 내부 로직은 `common/services/` 의 베이스를 상속받은 서비스를 통해 구성한다.

## 클래스 구조

```
BaseTask (celery.Task)
└── BaseScheduledTask        # cron 기반 주기 태스크
```

---

## 태스크 자동 발견 (autodiscover)

Celery는 `autodiscover_tasks()`로 각 앱의 `tasks` 패키지를 로드한다.
패키지(`tasks/`)를 사용할 경우, `__init__.py`에서 모든 태스크 모듈을 import해야 Worker가 태스크를 등록한다.

```python
# myapp/tasks/__init__.py
from .base_task import BaseTask
from .base_scheduled_task import BaseScheduledTask
from . import my_task        # noqa: F401
from . import another_task   # noqa: F401
```

---

## BaseTask — 일반 비동기 태스크

### 특징

- `abstract = True` — Celery가 베이스 클래스 자체를 태스크로 등록하지 않는다.
- `on_failure` / `on_retry` / `on_success` 에서 공통 로깅을 처리한다.
- `run()` 을 구현하고, 내부에서 Service 를 호출한다.

### 사용법

```python
# myapp/tasks.py
from config.celery import app
from common.tasks import BaseTask
from myapp.services import CreateSomethingService

class CreateSomethingTask(BaseTask):
    def run(self, user_id: int, **kwargs):
        return CreateSomethingService(user_id=user_id, **kwargs).perform()

# Celery 5.x 는 TaskType 메타클래스가 없어 클래스 정의만으로는 등록되지 않는다.
# register_task() 로 명시적으로 등록하고, 반환된 인스턴스로 재할당한다.
CreateSomethingTask = app.register_task(CreateSomethingTask())
```

```python
# 비동기 실행
CreateSomethingTask.delay(user_id=1)

# 지연 실행 (10초 후)
CreateSomethingTask.apply_async(kwargs={"user_id": 1}, countdown=10)
```

---

## BaseScheduledTask — Cron 주기 태스크

### 특징

- `BaseTask` 를 상속받는다.
- `schedule` 클래스 속성에 `crontab` 인스턴스를 지정한다.
- `to_beat_config()` 로 `CELERY_BEAT_SCHEDULE` 등록용 딕셔너리를 반환한다.

### 사용법

**1. 태스크 정의**

```python
# myapp/tasks.py
from celery.schedules import crontab
from config.celery import app
from common.tasks import BaseScheduledTask
from myapp.services import DailyReportService

class DailyReportTask(BaseScheduledTask):
    schedule = crontab(hour=0, minute=0)  # 매일 자정

    def run(self):
        return DailyReportService().perform()

DailyReportTask = app.register_task(DailyReportTask())
```

**2. Beat 스케줄 등록**

settings 파일에서 태스크 클래스를 직접 import 하면 `config.celery` → Django settings 순환 참조가 발생한다.
반드시 **모듈 경로 문자열**로 참조해야 한다.

```python
# config/settings/components/celery_beat.py
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    "myapp.tasks.DailyReportTask": {
        "task": "myapp.tasks.DailyReportTask",
        "schedule": crontab(hour=0, minute=0),
        "args": (),
        "kwargs": {},
        "options": {},
    },
}
```

> `to_beat_config()` 는 settings 파일 외부(예: management command, 테스트)에서
> 태스크 이름·schedule 정보를 확인하거나 출력할 때 활용한다.

### to_beat_config() 옵션

```python
# 태스크 인수 전달
**MyTask.to_beat_config(
    args=(1, 2),
    kwargs={"key": "value"},
)

# 특정 큐 지정
**MyTask.to_beat_config(
    options={"queue": "low_priority"},
)
```

반환 형태:

```python
{
    "myapp.tasks.MyTask": {
        "task": "myapp.tasks.MyTask",
        "schedule": crontab(hour=0, minute=0),
        "args": (),
        "kwargs": {},
        "options": {},
    }
}
```

### 여러 태스크 등록

```python
CELERY_BEAT_SCHEDULE = {
    **DailyReportTask.to_beat_config(),
    **WeeklyCleanupTask.to_beat_config(options={"queue": "low_priority"}),
}
```

---

## crontab 예시

| 표현식 | 설명 |
|--------|------|
| `crontab(minute=0, hour=0)` | 매일 자정 |
| `crontab(minute="*/30")` | 30분마다 |
| `crontab(hour=9, minute=0, day_of_week="mon-fri")` | 평일 오전 9시 |
| `crontab(day_of_month=1, hour=0, minute=0)` | 매월 1일 자정 |
