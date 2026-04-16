from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from subscriptions.enums import PlanType, SubscriptionStatus
from subscriptions.factories import SubscriptionFactory
from users.factories import UserFactory


class SubscriptionMeViewTest(TestCase):
  """SubscriptionMeView 단위 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory()
    self.user.email_confirmed_at = timezone.now()
    self.user.save()
    self.client.force_authenticate(user=self.user)

  def test_returns_auto_created_free_subscription_for_new_user(self):
    """신규 사용자는 자동으로 생성된 free 구독을 반환받는다."""
    response = self.client.get("/api/v1/subscriptions/me/")
    self.assertEqual(response.status_code, 200)
    self.assertEqual(response.data["plan_type"], PlanType.FREE)

  def test_returns_free_subscription(self):
    """무료 구독 조회 성공"""
    SubscriptionFactory(user=self.user, plan_type=PlanType.FREE)
    response = self.client.get("/api/v1/subscriptions/me/")
    self.assertEqual(response.status_code, 200)
    self.assertEqual(response.data["plan_type"], PlanType.FREE)

  def test_returns_pro_subscription_over_free(self):
    """유료 구독이 있을 때 유료 구독 반환"""
    SubscriptionFactory(user=self.user, plan_type=PlanType.FREE)
    pro_sub = SubscriptionFactory.create(user=self.user, pro=True)
    response = self.client.get("/api/v1/subscriptions/me/")
    self.assertEqual(response.status_code, 200)
    self.assertEqual(response.data["plan_type"], PlanType.PRO)
    self.assertEqual(response.data["id"], pro_sub.id)

  def test_cancelled_but_unexpired_pro_shows_as_active(self):
    """취소됐지만 아직 만료되지 않은 유료 구독은 ACTIVE로 반환된다."""
    SubscriptionFactory.create(user=self.user, pro=True, cancelled=True)
    response = self.client.get("/api/v1/subscriptions/me/")
    self.assertEqual(response.status_code, 200)
    self.assertEqual(response.data["plan_type"], PlanType.PRO)
    self.assertEqual(response.data["status"], SubscriptionStatus.ACTIVE)
    self.assertTrue(response.data["is_cancelled"])

  def test_requires_authentication(self):
    """비인증 요청 거부"""
    self.client.logout()
    response = self.client.get("/api/v1/subscriptions/me/")
    self.assertEqual(response.status_code, 401)

  def test_requires_email_verified(self):
    """이메일 미인증 사용자 거부"""
    self.user.email_confirmed_at = None
    self.user.save()
    response = self.client.get("/api/v1/subscriptions/me/")
    self.assertEqual(response.status_code, 403)

  def test_response_fields(self):
    """응답 필드 확인 — status, is_cancelled 포함"""
    response = self.client.get("/api/v1/subscriptions/me/")
    self.assertEqual(response.status_code, 200)
    expected_fields = {
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
    }
    self.assertEqual(set(response.data.keys()), expected_fields)
