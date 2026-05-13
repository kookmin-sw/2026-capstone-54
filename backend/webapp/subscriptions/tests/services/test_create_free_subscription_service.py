from django.test import TestCase
from subscriptions.enums import PlanType
from subscriptions.models import Subscription
from subscriptions.services import CreateFreeSubscriptionService
from users.factories import UserFactory


class CreateFreeSubscriptionServiceTests(TestCase):
  """CreateFreeSubscriptionService 테스트"""

  def setUp(self):
    self.user = UserFactory()

  def test_creates_free_subscription(self):
    """무료 구독을 생성한다."""
    sub = CreateFreeSubscriptionService(user=self.user).perform()

    self.assertEqual(sub.plan_type, PlanType.FREE)
    self.assertIsNone(sub.expires_at)
    self.assertEqual(Subscription.objects.filter(user=self.user).count(), 2)  # auto + manual
