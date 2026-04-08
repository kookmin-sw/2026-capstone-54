from django.test import TestCase
from tickets.models import TicketLog
from tickets.services import GrantTicketsService
from users.factories import UserFactory


class GrantTicketsServiceTests(TestCase):
  """GrantTicketsService 테스트"""

  def setUp(self):
    self.user = UserFactory()

  def test_grant_default_to_purchased(self):
    """기본 target은 purchased_count에 지급한다."""
    ticket = GrantTicketsService(user=self.user, amount=3).perform()

    self.assertEqual(ticket.purchased_count, 3)
    self.assertEqual(ticket.daily_count, 0)

  def test_grant_to_daily(self):
    """target=daily로 daily_count에 지급한다."""
    ticket = GrantTicketsService(user=self.user, amount=5, target="daily").perform()

    self.assertEqual(ticket.daily_count, 5)
    self.assertEqual(ticket.purchased_count, 0)

  def test_grant_auto_raises_error(self):
    """target=auto는 추가에 사용할 수 없다."""
    with self.assertRaises(ValueError):
      GrantTicketsService(user=self.user, amount=3, target="auto").perform()

  def test_grant_creates_log(self):
    """티켓 지급 시 TicketLog가 생성된다."""
    GrantTicketsService(user=self.user, amount=2, reason="출석 보상").perform()

    log = TicketLog.objects.get(user=self.user)
    self.assertEqual(log.action_type, TicketLog.ActionType.GRANT)
    self.assertEqual(log.amount, 2)
    self.assertEqual(log.balance_after, 2)

  def test_grant_zero_raises_error(self):
    """amount가 0이면 ValueError가 발생한다."""
    with self.assertRaises(ValueError):
      GrantTicketsService(user=self.user, amount=0).perform()
