from django.test import TestCase
from tickets.factories import UserTicketFactory
from tickets.models import TicketLog
from tickets.services import ExpireTicketsService
from users.factories import UserFactory


class ExpireTicketsServiceTests(TestCase):
  """ExpireTicketsService 테스트"""

  def setUp(self):
    self.user = UserFactory()

  def test_expire_deducts_count(self):
    """만료 처리 시 수량이 차감된다."""
    UserTicketFactory(user=self.user, count=10)
    ticket = ExpireTicketsService(user=self.user, amount=3).perform()

    self.assertEqual(ticket.count, 7)

  def test_expire_creates_log(self):
    """만료 처리 시 TicketLog가 음수 amount로 생성된다."""
    UserTicketFactory(user=self.user, count=5)
    ExpireTicketsService(user=self.user, amount=2).perform()

    log = TicketLog.objects.get(user=self.user)
    self.assertEqual(log.action_type, TicketLog.ActionType.EXPIRE)
    self.assertEqual(log.amount, -2)
    self.assertEqual(log.balance_after, 3)

  def test_expire_without_ticket_raises_error(self):
    """UserTicket이 없으면 ValueError가 발생한다."""
    with self.assertRaises(ValueError):
      ExpireTicketsService(user=self.user, amount=1).perform()

  def test_expire_insufficient_raises_error(self):
    """보유 수량보다 많이 만료하면 ValueError가 발생한다."""
    UserTicketFactory(user=self.user, count=2)
    with self.assertRaises(ValueError):
      ExpireTicketsService(user=self.user, amount=5).perform()

  def test_expire_zero_raises_error(self):
    """amount가 0이면 ValueError가 발생한다."""
    UserTicketFactory(user=self.user, count=5)
    with self.assertRaises(ValueError):
      ExpireTicketsService(user=self.user, amount=0).perform()
