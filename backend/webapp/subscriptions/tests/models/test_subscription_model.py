from datetime import timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from subscriptions.enums import PlanType, SubscriptionStatus
from subscriptions.factories import SubscriptionFactory
from users.factories import UserFactory


class SubscriptionModelTests(TestCase):
  """Subscription 모델 테스트"""

  def setUp(self):
    self.user = UserFactory()

  def test_free_subscription_is_always_active(self):
    """무료 구독(expires_at=None)은 항상 ACTIVE이다."""
    sub = SubscriptionFactory(user=self.user, plan_type=PlanType.FREE)
    self.assertEqual(sub.status, SubscriptionStatus.ACTIVE)

  def test_pro_subscription_active_before_expiry(self):
    """만료 전 유료 구독은 ACTIVE이다."""
    sub = SubscriptionFactory.create(user=self.user, pro=True)
    self.assertEqual(sub.status, SubscriptionStatus.ACTIVE)

  def test_expired_subscription_status(self):
    """만료된 구독의 status는 EXPIRED이다."""
    sub = SubscriptionFactory(
      user=self.user,
      plan_type=PlanType.PRO,
      started_at=timezone.now() - timedelta(days=60),
      expires_at=timezone.now() - timedelta(days=1),
    )
    self.assertEqual(sub.status, SubscriptionStatus.EXPIRED)

  def test_is_cancelled_false_by_default(self):
    """기본적으로 is_cancelled는 False이다."""
    sub = SubscriptionFactory(user=self.user)
    self.assertFalse(sub.is_cancelled)

  def test_is_cancelled_true_when_set(self):
    """cancelled_at이 설정되면 is_cancelled는 True이다."""
    sub = SubscriptionFactory.create(user=self.user, pro=True, cancelled=True)
    self.assertTrue(sub.is_cancelled)

  def test_paid_plan_without_expires_at_fails_validation(self):
    """유료 플랜에 expires_at이 없으면 ValidationError가 발생한다."""
    sub = SubscriptionFactory.build(
      user=self.user,
      plan_type=PlanType.PRO,
      expires_at=None,
    )
    with self.assertRaises(ValidationError) as ctx:
      sub.full_clean()
    self.assertIn("expires_at", ctx.exception.message_dict)

  def test_free_plan_without_expires_at_passes_validation(self):
    """무료 플랜은 expires_at 없이도 검증을 통과한다."""
    sub = SubscriptionFactory.build(
      user=self.user,
      plan_type=PlanType.FREE,
      expires_at=None,
    )
    sub.full_clean()  # should not raise
