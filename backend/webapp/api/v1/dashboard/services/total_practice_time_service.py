from common.services import BaseQueryService
from interviews.models import UserPracticeTimeStatistics


class TotalPracticeTimeService(BaseQueryService):
  required_value_kwargs: list[str] = []

  def execute(self) -> int:
    stats = (UserPracticeTimeStatistics.objects.filter(user=self.user).only("total_practice_time_seconds").first())
    return stats.total_practice_time_seconds if stats else 0
