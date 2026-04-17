from achievements.models import Achievement
from rest_framework import serializers


class AchievementListSerializer(serializers.ModelSerializer):
  is_achieved = serializers.BooleanField(read_only=True)
  achieved_at = serializers.DateTimeField(read_only=True, allow_null=True)
  reward_claimed_at = serializers.DateTimeField(read_only=True, allow_null=True)
  can_claim_reward = serializers.BooleanField(read_only=True)

  class Meta:
    model = Achievement
    fields = (
      "code",
      "name",
      "description",
      "category",
      "is_active",
      "starts_at",
      "ends_at",
      "is_achieved",
      "achieved_at",
      "reward_claimed_at",
      "can_claim_reward",
    )
