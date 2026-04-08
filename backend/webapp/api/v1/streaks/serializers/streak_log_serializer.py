from rest_framework import serializers
from streaks.models import StreakLog


class StreakLogSerializer(serializers.ModelSerializer):

  class Meta:
    model = StreakLog
    fields = ("date", "interview_results_count")
