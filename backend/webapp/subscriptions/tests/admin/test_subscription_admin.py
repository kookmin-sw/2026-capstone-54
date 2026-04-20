from django.contrib.admin.sites import AdminSite
from django.test import TestCase
from django.utils import timezone
from subscriptions.admin import SubscriptionAdmin
from subscriptions.enums import PlanType
from subscriptions.factories import SubscriptionFactory
from subscriptions.models import Subscription
from users.factories import UserFactory


class _DummyRequest:
  user = None


class SubscriptionAdminActionTests(TestCase):
  """구독 관리자 액션 동작 검증."""

  def setUp(self):
    self.site = AdminSite()
    self.admin = SubscriptionAdmin(Subscription, self.site)
    self.request = _DummyRequest()

  def test_set_selected_users_to_free_ends_paid_and_ensures_active_free(self):
    now = timezone.now()
    user = UserFactory()
    SubscriptionFactory.create(
      user=user,
      pro=True,
      started_at=now - timezone.timedelta(days=10),
      expires_at=now + timezone.timedelta(days=10),
    )

    queryset = Subscription.objects.filter(user=user)
    self.admin.set_selected_users_to_free(self.request, queryset)

    active_pro = Subscription.objects.filter(
      user=user,
      plan_type=PlanType.PRO,
      started_at__lte=now,
      expires_at__gt=now,
    ).exists()
    self.assertFalse(active_pro)

    active_free = Subscription.objects.filter(
      user=user,
      plan_type=PlanType.FREE,
      started_at__lte=now,
      expires_at__isnull=True,
    ).exists()
    self.assertTrue(active_free)

  def test_set_selected_users_to_pro_for_one_year_creates_new_pro(self):
    user = UserFactory()
    free_sub = SubscriptionFactory.create(user=user, plan_type=PlanType.FREE, expires_at=None)

    queryset = Subscription.objects.filter(pk=free_sub.pk)
    self.admin.set_selected_users_to_pro_for_one_year(self.request, queryset)

    latest = Subscription.objects.filter(user=user).order_by("-started_at").first()
    self.assertIsNotNone(latest)
    self.assertEqual(latest.plan_type, PlanType.PRO)
    self.assertIsNotNone(latest.expires_at)
    remaining_days = (latest.expires_at - latest.started_at).days
    self.assertGreaterEqual(remaining_days, 364)
