from common.validators import BaseValidator, validation_method
from django.core.exceptions import ValidationError
from subscriptions.enums import PlanType


class SubscriptionValidator(BaseValidator):
  """Subscription 모델 검증"""

  @validation_method(priority=10)
  def validate_paid_plan_requires_expires_at(self):
    """무료 플랜이 아닌 구독은 만료 일자가 필수이다."""
    if self.instance.plan_type != PlanType.FREE and not self.instance.expires_at:
      raise ValidationError({"expires_at": "무료 플랜이 아닌 구독은 만료 일자가 필수입니다."})
