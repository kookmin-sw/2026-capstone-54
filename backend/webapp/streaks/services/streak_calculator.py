from datetime import timedelta

from django.utils import timezone
from streaks.models import StreakStatistics


class StreakCalculator:
  """통계 계산만 담당 ( interview_results_count > 0 기준)."""

  def __init__(self, user):
    self.user = user

  def calculate(self):
    participated_logs = list(self.user.streak_logs.filter(interview_results_count__gt=0).order_by("date"))

    stats, _ = StreakStatistics.objects.get_or_create(user=self.user)

    stats.total_days = len(participated_logs)

    if not participated_logs:
      stats.current_streak = 0
      stats.longest_streak = 0
      stats.last_participated_date = None
      return stats

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

    today = timezone.localdate()
    yesterday = today - timedelta(days=1)
    if last_date not in (today, yesterday):
      current_streak = 0

    stats.current_streak = current_streak
    stats.longest_streak = longest_streak
    stats.last_participated_date = last_date

    return stats
