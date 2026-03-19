from celery.schedules import crontab
from common.services.ping_service import PingService
from config.celery import app

from .base_scheduled_task import BaseScheduledTask
from .base_task import BaseTask


class PingTask(BaseTask):
  """BaseTask 동작 검증용 태스크."""

  def run(self, message: str = "pong"):
    return PingService(message=message).perform()


class PingScheduledTask(BaseScheduledTask):
  """BaseScheduledTask 동작 검증용 태스크 (1분마다 실행)."""

  schedule = crontab(minute="*")

  def run(self):
    return PingService(message="scheduled pong").perform()


# NOTE: Celery 5.x 에서는 클래스 기반 태스크를 명시적으로 등록해야 한다.
# register_task() 가 등록된 인스턴스를 반환하므로 같은 이름으로 재할당하면
# .delay() / .apply_async() 를 직접 호출할 수 있다.
PingTask = app.register_task(PingTask())
PingScheduledTask = app.register_task(PingScheduledTask())
