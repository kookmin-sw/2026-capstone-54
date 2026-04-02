from django.test import TestCase
from tickets.factories import UserTicketFactory
from tickets.models import TicketLog, UserTicket
from tickets.services import RefundTicketsService
from users.factories import UserFactory


class RefundTicketsServiceTests(TestCase):
  """RefundTicketsService 테스트"""

  def setUp(self):
    self.user = UserFactory()

  def test_refund_creates_ticket_if_not_exists(self):
    """UserTicket이 없으면 생성 후 환불한다."""
    ticket = RefundTicketsService(user=self.user, amount=3).perform()

    self.assertEqual(ticket.count, 3)
    self.assertEqual(UserTicket.objects.count(), 1)

  def test_refund_adds_to_existing(self):
    """기존 UserTicket이 있으면 수량을 더한다."""
    UserTicketFactory(user=self.user, count=5)
    ticket = RefundTicketsService(user=self.user, amount=3).perform()

    self.assertEqual(ticket.count, 8)

  def test_refund_creates_log(self):
    """환불 시 TicketLog가 양수 amount로 생성된다."""
    RefundTicketsService(user=self.user, amount=4, reason="오류 환불").perform()

    log = TicketLog.objects.get(user=self.user)
    self.assertEqual(log.action_type, TicketLog.ActionType.REFUND)
    self.assertEqual(log.amount, 4)
    self.assertEqual(log.balance_after, 4)
    self.assertEqual(log.reason, "오류 환불")

  def test_refund_zero_raises_error(self):
    """amount가 0이면 ValueError가 발생한다."""
    with self.assertRaises(ValueError):
      RefundTicketsService(user=self.user, amount=0).perform()
