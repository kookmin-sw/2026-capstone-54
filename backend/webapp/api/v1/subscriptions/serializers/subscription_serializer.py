from rest_framework import serializers
from subscriptions.models import Subscription
from subscriptions.services import PlanFeaturePolicyService


class SubscriptionSerializer(serializers.ModelSerializer):
  plan_type_display = serializers.CharField(source="get_plan_type_display", read_only=True)
  status = serializers.CharField(read_only=True)
  is_cancelled = serializers.BooleanField(read_only=True)
  policy = serializers.SerializerMethodField()

  def get_policy(self, obj: Subscription):
    return PlanFeaturePolicyService.get_policy(obj.plan_type)

  class Meta:
    model = Subscription
    fields = [
      "id",
      "plan_type",
      "plan_type_display",
      "status",
      "is_cancelled",
      "policy",
      "started_at",
      "expires_at",
      "cancelled_at",
      "created_at",
      "updated_at",
    ]
    read_only_fields = fields
