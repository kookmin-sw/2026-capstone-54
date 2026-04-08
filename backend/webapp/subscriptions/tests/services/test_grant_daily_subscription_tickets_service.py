from django.test import TestCase
from subscriptions.enums import PlanType
from subscriptions.factories import (
  SubscriptionFactory,
  SubscriptionPlanTicketPolicyFactory,
)
from subscriptions.services import GrantDailySubscriptionTicketsService
from tickets.models import UserTicket
from users.factories import UserFactory


class GrantDailySubscriptionTicketsServiceTests(TestCase):
  """GrantDailySubscriptionTicketsService 테스트

  주의: UserFactory()는 post_save 시그널로 FREE 구독을 자동 생성한다.
  시그널 구독과 겹치지 않도록 PRO 정책/구독으로 테스트한다.
  """

  def setUp(self):
    self.user = UserFactory()

  def test_resets_daily_count_for_active_subscription(self):
    """활성 구독 사용자의 daily_count를 정책 값으로 리셋한다."""
    SubscriptionPlanTicketPolicyFactory(plan_type=PlanType.PRO, daily_ticket_amount=300)
    SubscriptionFactory.create(user=self.user, pro=True)

    count = GrantDailySubscriptionTicketsService().perform()

    ticket = UserTicket.objects.get(user=self.user)
    self.assertEqual(ticket.daily_count, 300)
    self.assertEqual(count, 1)

  def test_does_not_affect_purchased_count(self):
    """일일 리셋은 purchased_count에 영향을 주지 않는다."""
    SubscriptionPlanTicketPolicyFactory(plan_type=PlanType.PRO, daily_ticket_amount=300)
    SubscriptionFactory.create(user=self.user, pro=True)
    UserTicket.objects.create(user=self.user, daily_count=5, purchased_count=10)

    GrantDailySubscriptionTicketsService().perform()

    ticket = UserTicket.objects.get(user=self.user)
    self.assertEqual(ticket.daily_count, 300)
    self.assertEqual(ticket.purchased_count, 10)

  def test_no_policy_returns_zero(self):
    """활성 정책이 없으면 0을 반환한다."""
    count = GrantDailySubscriptionTicketsService().perform()
    self.assertEqual(count, 0)

  def test_expired_subscription_is_skipped(self):
    """만료된 구독은 건너뛴다."""
    SubscriptionPlanTicketPolicyFactory(plan_type=PlanType.PRO, daily_ticket_amount=300)
    SubscriptionFactory.create(user=self.user, pro=True, expired=True)

    count = GrantDailySubscriptionTicketsService().perform()

    self.assertEqual(count, 0)
    self.assertFalse(UserTicket.objects.filter(user=self.user).exists())

  def test_multiple_users(self):
    """여러 사용자에게 일괄 리셋한다."""
    SubscriptionPlanTicketPolicyFactory(plan_type=PlanType.PRO, daily_ticket_amount=300)
    users = [UserFactory() for _ in range(3)]
    for u in users:
      SubscriptionFactory.create(user=u, pro=True)

    count = GrantDailySubscriptionTicketsService().perform()

    self.assertEqual(count, 3)
    for u in users:
      ticket = UserTicket.objects.get(user=u)
      self.assertEqual(ticket.daily_count, 300)
