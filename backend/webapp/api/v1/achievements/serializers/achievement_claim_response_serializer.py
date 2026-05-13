from rest_framework import serializers


class AchievementClaimResponseSerializer(serializers.Serializer):
  achievement_code = serializers.CharField()
  reward_claimed_at = serializers.DateTimeField()
