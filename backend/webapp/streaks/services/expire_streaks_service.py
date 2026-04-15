from datetime import timedelta

from common.services import BaseService
from django.db import transaction
from django.utils import timezone
from streaks.signals import streak_expired


class ExpireStreaksService(BaseService):
  """매일 자정 실행. 전날 면접에 참여하지 않은 사용자의 current_streak을 0으로 초기화한다.

  longest_streak은 영구 보존되어 초기화하지 않는다.

  Celery Beat 설정 예시 (추후 등록):
  CELERY_BEAT_SCHEDULE = {
    "expire-streaks-daily": {
      "task": "streaks.tasks.expire_streaks",
      "schedule": crontab(hour=0, minute=5),
    },
  }
  """

  def execute(self):
    from streaks.models import StreakStatistics

    yesterday = timezone.localdate() - timedelta(days=1)
    expired_qs = StreakStatistics.objects.filter(
      current_streak__gt=0,
      last_participated_date__lt=yesterday,
    )
    expired_user_ids = list(expired_qs.values_list("user_id", flat=True))
    expired_count = expired_qs.update(current_streak=0)

    if expired_user_ids:
      transaction.on_commit(lambda: streak_expired.send(
        sender=self.__class__,
        expired_user_ids=expired_user_ids,
      ))

    return expired_count
