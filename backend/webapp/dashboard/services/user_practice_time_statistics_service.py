from common.services import BaseService
from django.db import transaction
from django.utils import timezone


class UserPracticeTimeStatisticsService(BaseService):
  """사용자 연습 시간 통계 관리 서비스. recalculate 로 InterviewRecording 합산값을 갱신한다."""

  def execute(self):
    raise NotImplementedError("Use specific method instead of execute()")

  def recalculate(self):
    from interviews.models import UserPracticeTimeStatistics

    from .user_practice_time_calculator import UserPracticeTimeCalculator

    with transaction.atomic():
      stats, _ = UserPracticeTimeStatistics.objects.select_for_update().get_or_create(user=self.user)

      result = UserPracticeTimeCalculator(self.user).calculate()
      stats.total_practice_time_seconds = result["total_practice_time_seconds"]
      stats.total_practice_sessions_count = result["total_practice_sessions_count"]
      stats.last_calculated_at = timezone.now()
      stats.save(
        update_fields=[
          "total_practice_time_seconds",
          "total_practice_sessions_count",
          "last_calculated_at",
          "updated_at",
        ]
      )

      return stats
