from django.db.models import Count, Sum
from django.utils import timezone
from interviews.enums import RecordingStatus
from interviews.models import InterviewRecording


class UserPracticeTimeCalculator:
  """연습 시간 집계만 담당 (status=COMPLETED, duration_ms NOT NULL 기준)."""

  def __init__(self, user):
    self.user = user

  def calculate(self) -> dict:
    aggregated = InterviewRecording.objects.filter(
      user=self.user,
      status=RecordingStatus.COMPLETED,
      duration_ms__isnull=False,
    ).aggregate(
      total_ms=Sum("duration_ms"),
      sessions_count=Count("pk"),
    )

    total_ms = aggregated["total_ms"] or 0
    sessions_count = aggregated["sessions_count"] or 0

    return {
      "total_practice_time_seconds": int(total_ms // 1000),
      "total_practice_sessions_count": int(sessions_count),
    }

  @staticmethod
  def bulk_calculate(users) -> int:
    """여러 사용자의 통계를 한 번에 재계산하고 처리된 사용자 수를 반환한다."""
    from interviews.models import UserPracticeTimeStatistics

    user_list = list(users)
    if not user_list:
      return 0

    existing_stats = {stats.user_id: stats for stats in UserPracticeTimeStatistics.objects.filter(user__in=user_list)}

    now = timezone.now()
    stats_to_create = []
    stats_to_update = []

    for user in user_list:
      result = UserPracticeTimeCalculator(user).calculate()

      if user.id in existing_stats:
        stats = existing_stats[user.id]
      else:
        stats = UserPracticeTimeStatistics(user=user)

      stats.total_practice_time_seconds = result["total_practice_time_seconds"]
      stats.total_practice_sessions_count = result["total_practice_sessions_count"]
      stats.last_calculated_at = now
      stats.updated_at = now

      if stats.pk:
        stats_to_update.append(stats)
      else:
        stats_to_create.append(stats)

    if stats_to_create:
      UserPracticeTimeStatistics.objects.bulk_create(stats_to_create)

    if stats_to_update:
      UserPracticeTimeStatistics.objects.bulk_update(
        stats_to_update,
        fields=[
          "total_practice_time_seconds",
          "total_practice_sessions_count",
          "last_calculated_at",
          "updated_at",
        ],
      )

    return len(stats_to_create) + len(stats_to_update)
