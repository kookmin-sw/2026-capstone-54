from datetime import timedelta

from django.db.models import Prefetch
from django.utils import timezone
from streaks.models import StreakLog, StreakStatistics


class StreakCalculator:
  """통계 계산만 담당 ( interview_results_count > 0 기준)."""

  def __init__(self, user, today=None):
    self.user = user
    self.today = today or timezone.localdate()

  def calculate(self):
    participated_logs = list(self.user.streak_logs.filter(interview_results_count__gt=0).order_by("date"))

    stats, _ = StreakStatistics.objects.get_or_create(user=self.user)

    self._apply_stats(stats, participated_logs, self.today)
    return stats

  @staticmethod
  def bulk_calculate(users, today=None):
    """여러 사용자의 통계를 한 번에 재계산 (N+1 방지)."""
    target_date = today or timezone.localdate()

    users_with_prefetch = users.prefetch_related(
      Prefetch(
        "streak_logs",
        queryset=StreakLog.objects.filter(interview_results_count__gt=0).order_by("date"),
      ),
    )

    existing_stats = {
      stats.user_id: stats
      for stats in StreakStatistics.objects.filter(user__in=users).select_related("user")
    }

    stats_to_update = []
    stats_to_create = []

    for user in users_with_prefetch:
      participated_logs = list(user.streak_logs.all())
      user_id = user.id

      if user_id in existing_stats:
        stats = existing_stats[user_id]
      else:
        stats = StreakStatistics(user=user)

      StreakCalculator._apply_stats(stats, participated_logs, target_date)

      if stats.pk:
        stats_to_update.append(stats)
      else:
        stats_to_create.append(stats)

    if stats_to_create:
      StreakStatistics.objects.bulk_create(stats_to_create)

    if stats_to_update:
      StreakStatistics.objects.bulk_update(
        stats_to_update,
        fields=[
          "current_streak",
          "longest_streak",
          "last_participated_date",
          "total_days",
          "updated_at",
        ],
      )

    return len(stats_to_update) + len(stats_to_create)

  @staticmethod
  def _apply_stats(stats, participated_logs, today=None):
    now = timezone.now()
    stats.updated_at = now
    stats.total_days = len(participated_logs)

    if not participated_logs:
      stats.current_streak = 0
      stats.longest_streak = 0
      stats.last_participated_date = None
      return

    current_streak = 1
    longest_streak = 1
    last_date = participated_logs[0].date

    for log in participated_logs[1:]:
      if log.date == last_date + timedelta(days=1):
        current_streak += 1
        longest_streak = max(longest_streak, current_streak)
      elif log.date > last_date + timedelta(days=1):
        current_streak = 1
      last_date = log.date

    target_date = today or timezone.localdate()
    yesterday = target_date - timedelta(days=1)
    if last_date not in (target_date, yesterday):
      current_streak = 0

    stats.current_streak = current_streak
    stats.longest_streak = longest_streak
    stats.last_participated_date = last_date
