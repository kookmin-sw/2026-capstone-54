import structlog
from achievements.services import EvaluateAchievementsService
from common.tasks.base_task import BaseTask
from config.celery import app
from django.core.cache import cache

_COALESCE_TTL_SECONDS = 30
_COALESCE_PREFIX = "achievement:evaluate:coalesce:"
logger = structlog.get_logger(__name__)


class EvaluateAchievementsTask(BaseTask):
  """사용자 도전과제 조건을 비동기로 평가한다."""

  def run(self, user_id: int, trigger_type: str, trigger_key: str, context: dict | None = None):
    from users.models import User

    user = User.objects.filter(id=user_id).first()
    if not user:
      return 0
    created = EvaluateAchievementsService(
      user=user,
      trigger_type=trigger_type,
      trigger_key=trigger_key,
      context=context or {},
    ).perform()
    return len(created)


RegisteredEvaluateAchievementsTask = app.register_task(EvaluateAchievementsTask())


def enqueue_evaluate_achievements_task(user_id: int, trigger_type: str, trigger_key: str, context: dict | None = None):
  """짧은 구간 중복 요청을 합치며 도전과제 평가 태스크를 큐에 적재한다."""
  coalesce_key = f"{_COALESCE_PREFIX}{user_id}:{trigger_type}:{trigger_key}"
  if not cache.add(coalesce_key, 1, timeout=_COALESCE_TTL_SECONDS):
    logger.info(
      "achievement_evaluation_enqueued_coalesced",
      extra={
        "event": "achievement_evaluation_enqueued_coalesced",
        "user_id": user_id,
        "trigger_key": trigger_key,
        "failure_reason": "coalesced",
      },
    )
    return False
  RegisteredEvaluateAchievementsTask.delay(
    user_id=user_id,
    trigger_type=trigger_type,
    trigger_key=trigger_key,
    context=context or {},
  )
  logger.info(
    "achievement_evaluation_enqueued",
    extra={
      "event": "achievement_evaluation_enqueued",
      "user_id": user_id,
      "trigger_key": trigger_key,
      "evaluation_result": True,
    },
  )
  return True
