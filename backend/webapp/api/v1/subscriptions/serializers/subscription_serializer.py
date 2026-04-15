from rest_framework import serializers
from subscriptions.models import Subscription


class SubscriptionSerializer(serializers.ModelSerializer):
  plan_type_display = serializers.CharField(source="get_plan_type_display", read_only=True)
  status = serializers.CharField(read_only=True)
  is_cancelled = serializers.BooleanField(read_only=True)

  class Meta:
    model = Subscription
    fields = [
      "id",
      "plan_type",
      "plan_type_display",
      "status",
      "is_cancelled",
      "started_at",
      "expires_at",
      "cancelled_at",
      "created_at",
      "updated_at",
    ]
    read_only_fields = fields
