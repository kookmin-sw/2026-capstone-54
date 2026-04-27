from common.tasks.base_task import BaseTask
from config.celery import app


class RecalculatePracticeTimeTask(BaseTask):
  """사용자 연습 시간 통계를 비동기로 재계산한다."""

  def run(self, user_id: int):
    from dashboard.services import UserPracticeTimeStatisticsService
    from users.models import User

    user = User.objects.filter(id=user_id).first()
    if not user:
      return None
    UserPracticeTimeStatisticsService(user=user).recalculate()
    return user_id


RegisteredRecalculatePracticeTimeTask = app.register_task(RecalculatePracticeTimeTask())


def enqueue_recalculate_practice_time_task(user_id: int):
  """연습 시간 통계 재계산 태스크를 큐에 적재한다."""
  RegisteredRecalculatePracticeTimeTask.delay(user_id=user_id)
