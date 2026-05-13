"""
Celery Beat 주기적 태스크 베이스 모듈.

BaseTask 를 상속받아 cron 기반 주기 태스크를 추상화한다.
to_beat_config() 를 통해 CELERY_BEAT_SCHEDULE 에 간편하게 등록할 수 있다.

Usage::

  from celery.schedules import crontab
  from config.celery import app
  from common.tasks.base_scheduled_task import BaseScheduledTask
  from myapp.services import DailyReportService

  class DailyReportTask(BaseScheduledTask):
      schedule = crontab(hour=0, minute=0)  # 매일 자정

      def run(self):
          return DailyReportService().perform()

  # Celery 5.x 에서는 클래스 기반 태스크를 명시적으로 등록해야 한다.
  RegisteredDailyReportTask = app.register_task(DailyReportTask())

  # celery_beat.py 에 등록:
  #
  #   from myapp.tasks import DailyReportTask
  #
  #   CELERY_BEAT_SCHEDULE = {
  #       **DailyReportTask.to_beat_config(),
  #   }
  #
  # to_beat_config() 는 아래 형태의 딕셔너리를 반환한다:
  #   {
  #       "myapp.tasks.DailyReportTask": {
  #           "task": "myapp.tasks.DailyReportTask",
  #           "schedule": crontab(hour=0, minute=0),
  #           "args": (),
  #           "kwargs": {},
  #           "options": {},
  #       }
  #   }
"""

from celery.schedules import crontab

from .base_task import BaseTask


class BaseScheduledTask(BaseTask):
  """Celery Beat 주기적 태스크 베이스 클래스.

  - schedule: 실행 주기를 crontab 인스턴스로 정의한다.
  - to_beat_config(): CELERY_BEAT_SCHEDULE 에 추가할 딕셔너리를 반환한다.
  """

  abstract = True
  schedule: crontab | None = None

  @classmethod
  def to_beat_config(
    cls,
    args: tuple = (),
    kwargs: dict | None = None,
    options: dict | None = None,
  ) -> dict:
    """CELERY_BEAT_SCHEDULE 에 등록할 설정 딕셔너리를 반환한다.

    Args:
      args: 태스크 실행 시 전달할 위치 인수.
      kwargs: 태스크 실행 시 전달할 키워드 인수.
      options: apply_async 옵션 (예: {"queue": "high_priority"}).

    Returns:
      CELERY_BEAT_SCHEDULE 에 spread(**) 할 수 있는 딕셔너리.

    Raises:
      NotImplementedError: schedule 이 정의되지 않은 경우.
    """
    if cls.schedule is None:
      raise NotImplementedError(f"{cls.__name__}.schedule must be defined as a crontab instance.")

    return {
      cls.name: {
        "task": cls.name,
        "schedule": cls.schedule,
        "args": args,
        "kwargs": kwargs or {},
        "options": options or {},
      }
    }
