from rest_framework import serializers


class AchievementRefreshResponseSerializer(serializers.Serializer):
  created_achievements_count = serializers.IntegerField()
