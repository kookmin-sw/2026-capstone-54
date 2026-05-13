from django.test import TestCase
from subscriptions.enums import PlanType
from subscriptions.models import SubscriptionPlanTicketPolicy
from subscriptions.services import SeedTicketPolicyService


class SeedTicketPolicyServiceTests(TestCase):
  """SeedTicketPolicyService 테스트"""

  def test_creates_default_policies(self):
    """기본 정책 2개를 생성한다."""
    result = SeedTicketPolicyService().perform()

    self.assertEqual(result["created_count"], 2)
    self.assertEqual(SubscriptionPlanTicketPolicy.objects.count(), 2)

    free = SubscriptionPlanTicketPolicy.objects.get(plan_type=PlanType.FREE)
    self.assertEqual(free.daily_ticket_amount, 10)

    pro = SubscriptionPlanTicketPolicy.objects.get(plan_type=PlanType.PRO)
    self.assertEqual(pro.daily_ticket_amount, 30)

  def test_skips_existing_policies(self):
    """이미 존재하는 정책은 건너뛴다."""
    SubscriptionPlanTicketPolicy.objects.create(
      plan_type=PlanType.FREE,
      daily_ticket_amount=10,
    )

    result = SeedTicketPolicyService().perform()

    self.assertEqual(result["created_count"], 1)
    free = SubscriptionPlanTicketPolicy.objects.get(plan_type=PlanType.FREE)
    self.assertEqual(free.daily_ticket_amount, 10)
