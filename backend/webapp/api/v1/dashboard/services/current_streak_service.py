from common.services import BaseQueryService
from streaks.models import StreakStatistics


class CurrentStreakService(BaseQueryService):
  required_value_kwargs: list[str] = []

  def execute(self) -> int:
    stats = StreakStatistics.objects.filter(user=self.user).only("current_streak").first()
    return stats.current_streak if stats else 0
