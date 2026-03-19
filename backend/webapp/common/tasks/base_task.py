"""
Celery 비동기 태스크 베이스 모듈.

각 앱의 태스크는 이 클래스를 base로 지정하고,
run() 내에서 BaseService 또는 BaseQueryService 의 하위 서비스를 호출한다.

Usage::

  from config.celery import app
  from common.tasks.base_task import BaseTask
  from myapp.services import CreateSomethingService

  @app.task(bind=True, base=BaseTask)
  class CreateSomethingTask(BaseTask):
      def run(self, user_id: int, **kwargs):
          return CreateSomethingService(user_id=user_id, **kwargs).perform()

  # 비동기 실행
  CreateSomethingTask.delay(user_id=1)

  # 지연 실행
  CreateSomethingTask.apply_async(kwargs={"user_id": 1}, countdown=10)
"""

import logging
from abc import abstractmethod

from celery import Task

logger = logging.getLogger(__name__)


class BaseTask(Task):
  """Celery 태스크 공통 베이스 클래스.

  - abstract = True 로 설정되어 Celery 가 이 클래스 자체를 태스크로 등록하지 않는다.
  - on_failure / on_retry / on_success 에서 공통 로깅을 처리한다.
  - 각 앱의 태스크는 run() 을 구현하고, 내부에서 Service 를 호출한다.
  """

  abstract = True

  def on_failure(self, exc, task_id, args, kwargs, einfo):
    logger.error(
      "Task failed | task=%s task_id=%s exc=%s\n%s",
      self.name,
      task_id,
      exc,
      einfo,
    )
    super().on_failure(exc, task_id, args, kwargs, einfo)

  def on_retry(self, exc, task_id, args, kwargs, einfo):
    logger.warning(
      "Task retrying | task=%s task_id=%s exc=%s",
      self.name,
      task_id,
      exc,
    )
    super().on_retry(exc, task_id, args, kwargs, einfo)

  def on_success(self, retval, task_id, args, kwargs):
    logger.info(
      "Task succeeded | task=%s task_id=%s",
      self.name,
      task_id,
    )
    super().on_success(retval, task_id, args, kwargs)

  @abstractmethod
  def run(self, *args, **kwargs):
    """태스크 실행 진입점. 반드시 구현해야 한다."""
    raise NotImplementedError
