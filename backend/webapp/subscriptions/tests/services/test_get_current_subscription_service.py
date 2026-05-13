from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from subscriptions.enums import PlanType, SubscriptionStatus
from subscriptions.factories import SubscriptionFactory
from subscriptions.services import GetCurrentSubscriptionService
from users.factories import UserFactory


class GetCurrentSubscriptionServiceTest(TestCase):

  def setUp(self):
    self.user = UserFactory()

  def test_returns_auto_created_free_subscription(self):
    """사용자 생성 시 자동으로 생성된 free 구독을 반환한다."""
    result = GetCurrentSubscriptionService(user=self.user).perform()
    self.assertIsNotNone(result)
    self.assertEqual(result.plan_type, PlanType.FREE)

  def test_returns_free_subscription_when_no_paid(self):
    SubscriptionFactory(user=self.user, plan_type=PlanType.FREE)
    result = GetCurrentSubscriptionService(user=self.user).perform()
    self.assertIsNotNone(result)
    self.assertEqual(result.plan_type, PlanType.FREE)

  def test_returns_pro_subscription_over_free(self):
    """유료 구독이 있을 때 유료 구독을 우선 반환한다."""
    SubscriptionFactory(user=self.user, plan_type=PlanType.FREE)
    pro_sub = SubscriptionFactory.create(user=self.user, pro=True)
    result = GetCurrentSubscriptionService(user=self.user).perform()
    self.assertEqual(result, pro_sub)

  def test_ignores_cancelled_but_active_paid_subscription(self):
    """취소됐지만 expires_at이 미래인 유료 구독은 여전히 활성이다."""
    pro_sub = SubscriptionFactory.create(user=self.user, pro=True, cancelled=True)
    self.assertEqual(pro_sub.status, SubscriptionStatus.ACTIVE)
    self.assertTrue(pro_sub.is_cancelled)
    result = GetCurrentSubscriptionService(user=self.user).perform()
    self.assertEqual(result, pro_sub)

  def test_ignores_expired_subscription(self):
    """만료된 구독은 무시하고 free 구독을 반환한다."""
    SubscriptionFactory(
      user=self.user,
      plan_type=PlanType.PRO,
      started_at=timezone.now() - timedelta(days=60),
      expires_at=timezone.now() - timedelta(days=1),
    )
    result = GetCurrentSubscriptionService(user=self.user).perform()
    self.assertEqual(result.plan_type, PlanType.FREE)

  def test_expired_subscription_status_is_expired(self):
    """만료된 구독의 status property는 EXPIRED를 반환한다."""
    sub = SubscriptionFactory(
      user=self.user,
      plan_type=PlanType.PRO,
      started_at=timezone.now() - timedelta(days=60),
      expires_at=timezone.now() - timedelta(days=1),
    )
    self.assertEqual(sub.status, SubscriptionStatus.EXPIRED)

  def test_free_subscription_is_always_active(self):
    """무료 구독(expires_at=None)의 status는 항상 ACTIVE다."""
    sub = SubscriptionFactory(user=self.user, plan_type=PlanType.FREE)
    self.assertEqual(sub.status, SubscriptionStatus.ACTIVE)

  def test_is_cancelled_false_by_default(self):
    sub = SubscriptionFactory(user=self.user, plan_type=PlanType.FREE)
    self.assertFalse(sub.is_cancelled)

  def test_is_cancelled_true_when_cancelled_at_set(self):
    sub = SubscriptionFactory.create(user=self.user, pro=True, cancelled=True)
    self.assertTrue(sub.is_cancelled)
