from django.test import TestCase
from tickets.factories import UserTicketFactory
from tickets.models import TicketLog, UserTicket
from tickets.services import GrantTicketsService
from users.factories import UserFactory


class GrantTicketsServiceTests(TestCase):
  """GrantTicketsService 테스트"""

  def setUp(self):
    self.user = UserFactory()

  def test_grant_creates_ticket_if_not_exists(self):
    """UserTicket이 없으면 생성 후 티켓을 지급한다."""
    ticket = GrantTicketsService(user=self.user, amount=3).perform()

    self.assertEqual(ticket.count, 3)
    self.assertEqual(UserTicket.objects.count(), 1)

  def test_grant_adds_to_existing(self):
    """기존 UserTicket이 있으면 수량을 더한다."""
    UserTicketFactory(user=self.user, count=5)
    ticket = GrantTicketsService(user=self.user, amount=3).perform()

    self.assertEqual(ticket.count, 8)

  def test_grant_creates_log(self):
    """티켓 지급 시 TicketLog가 생성된다."""
    GrantTicketsService(user=self.user, amount=2, reason="출석 보상").perform()

    log = TicketLog.objects.get(user=self.user)
    self.assertEqual(log.action_type, TicketLog.ActionType.GRANT)
    self.assertEqual(log.amount, 2)
    self.assertEqual(log.balance_after, 2)
    self.assertEqual(log.reason, "출석 보상")

  def test_grant_zero_raises_error(self):
    """amount가 0이면 ValueError가 발생한다."""
    with self.assertRaises(ValueError):
      GrantTicketsService(user=self.user, amount=0).perform()
