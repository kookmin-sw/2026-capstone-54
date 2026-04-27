from rest_framework import serializers


class DashboardStatisticsSerializer(serializers.Serializer):
  total_completed_interviews = serializers.IntegerField()
  average_score = serializers.FloatField(allow_null=True)
  average_score_sample_size = serializers.IntegerField()
  current_streak_days = serializers.IntegerField()
  total_practice_time_seconds = serializers.IntegerField()
