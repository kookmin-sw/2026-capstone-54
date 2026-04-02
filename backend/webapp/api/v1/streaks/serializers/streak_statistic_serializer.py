from rest_framework import serializers
from streaks.models import StreakStatistics


class StreakStatisticSerializer(serializers.ModelSerializer):
  """스트릭 통계."""

  class Meta:
    model = StreakStatistics
    fields = (
      "current_streak",
      "longest_streak",
      "last_participated_date",
    )
