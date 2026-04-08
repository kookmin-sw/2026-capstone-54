from django.db import IntegrityError
from django.test import TestCase
from subscriptions.enums import PlanType
from subscriptions.factories import SubscriptionPlanTicketPolicyFactory


class SubscriptionPlanTicketPolicyModelTests(TestCase):
  """SubscriptionPlanTicketPolicy 모델 테스트"""

  def test_create(self):
    """정상적으로 생성된다."""
    policy = SubscriptionPlanTicketPolicyFactory(plan_type=PlanType.PRO)
    self.assertIsNotNone(policy.pk)
    self.assertEqual(policy.plan_type, PlanType.PRO)

  def test_unique_plan_type(self):
    """동일 plan_type은 중복 생성이 불가능하다."""
    SubscriptionPlanTicketPolicyFactory(plan_type=PlanType.PRO)
    with self.assertRaises(IntegrityError):
      SubscriptionPlanTicketPolicyFactory(plan_type=PlanType.PRO)

  def test_str(self):
    """__str__은 플랜 이름과 일일 지급량을 포함한다."""
    policy = SubscriptionPlanTicketPolicyFactory(
      plan_type=PlanType.FREE,
      daily_ticket_amount=30,
    )
    result = str(policy)
    self.assertIn("30", result)
