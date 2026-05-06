from django.test import TestCase
from subscriptions.enums import PlanType
from subscriptions.models import SubscriptionPlanTicketPolicy
from subscriptions.services import GrantInitialSubscriptionTicketsService
from tickets.models import UserTicket
from users.factories import UserFactory


class GrantInitialSubscriptionTicketsServiceTests(TestCase):
  """GrantInitialSubscriptionTicketsService 테스트"""

  def setUp(self):
    self.user = UserFactory()

  def test_grants_initial_tickets_for_free_plan(self):
    """FREE 플랜 사용자에게 초기 티켓을 지급한다."""
    # FREE 플랜 정책 생성
    policy = SubscriptionPlanTicketPolicy.objects.create(
      plan_type=PlanType.FREE,
      daily_ticket_amount=5,
      is_active=True,
    )

    # 서비스 실행
    user_ticket = GrantInitialSubscriptionTicketsService(user=self.user).perform()

    # 검증
    self.assertIsNotNone(user_ticket)
    self.assertEqual(user_ticket.user, self.user)
    self.assertEqual(user_ticket.daily_count, policy.daily_ticket_amount)
    self.assertEqual(user_ticket.purchased_count, 0)

  def test_returns_none_when_no_active_policy(self):
    """활성 정책이 없으면 None을 반환한다."""
    # 활성 정책이 없는 상태에서 서비스 실행
    result = GrantInitialSubscriptionTicketsService(user=self.user).perform()

    # 검증
    self.assertIsNone(result)

  def test_creates_user_ticket_even_when_policy_has_zero_tickets(self):
    """정책의 일일 티켓이 0이어도 UserTicket 레코드를 생성한다."""
    # 일일 티켓이 0인 정책 생성
    SubscriptionPlanTicketPolicy.objects.create(
      plan_type=PlanType.FREE,
      daily_ticket_amount=0,
      is_active=True,
    )

    # 서비스 실행
    user_ticket = GrantInitialSubscriptionTicketsService(user=self.user).perform()

    # 검증: UserTicket이 생성되어야 함
    self.assertIsNotNone(user_ticket)
    self.assertEqual(user_ticket.user, self.user)
    self.assertEqual(user_ticket.daily_count, 0)
    self.assertEqual(user_ticket.purchased_count, 0)

  def test_updates_existing_user_ticket(self):
    """기존 UserTicket이 있으면 업데이트한다."""
    # 정책 생성
    policy = SubscriptionPlanTicketPolicy.objects.create(
      plan_type=PlanType.FREE,
      daily_ticket_amount=10,
      is_active=True,
    )

    # 기존 UserTicket 생성
    existing_ticket = UserTicket.objects.create(
      user=self.user,
      daily_count=3,
      purchased_count=5,
    )

    # 서비스 실행
    user_ticket = GrantInitialSubscriptionTicketsService(user=self.user).perform()

    # 검증
    self.assertEqual(user_ticket.id, existing_ticket.id)
    self.assertEqual(user_ticket.daily_count, policy.daily_ticket_amount)
    self.assertEqual(user_ticket.purchased_count, 5)  # purchased_count는 유지

  def test_handles_inactive_policy(self):
    """비활성 정책은 무시한다."""
    # 비활성 정책 생성
    SubscriptionPlanTicketPolicy.objects.create(
      plan_type=PlanType.FREE,
      daily_ticket_amount=5,
      is_active=False,
    )

    # 서비스 실행
    result = GrantInitialSubscriptionTicketsService(user=self.user).perform()

    # 검증
    self.assertIsNone(result)
