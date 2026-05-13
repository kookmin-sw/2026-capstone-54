from datetime import timedelta

from django.core.cache import cache
from django.utils import timezone
from streaks.models import StreakStatistics


class StreakExpirer:
  """만료된 streak의 current_streak을 0으로 리셋."""

  def __init__(self, user=None):
    self.user = user
    self.expired_user_ids = []

  def execute(self):
    today = timezone.localdate()
    yesterday = today - timedelta(days=1)

    qs = StreakStatistics.objects.filter(
      current_streak__gt=0,
      last_participated_date__isnull=False,
      last_participated_date__lt=yesterday,
    )

    if self.user:
      qs = qs.filter(user=self.user)

    stats_to_update = []
    now = timezone.now()
    for stats in qs:
      stats.current_streak = 0
      stats.updated_at = now
      stats_to_update.append(stats)
      self.expired_user_ids.append(stats.user_id)

    if stats_to_update:
      StreakStatistics.objects.bulk_update(
        stats_to_update,
        fields=["current_streak", "updated_at"],
      )

    # 만료된 사용자의 마일스톤 캐시 무효화
    for user_id in self.expired_user_ids:
      cache.delete(f'milestones_user_{user_id}')

    return {
      "expired_count": len(stats_to_update),
      "expired_user_ids": self.expired_user_ids,
    }
