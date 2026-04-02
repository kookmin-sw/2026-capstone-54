from django.test import TestCase
from tickets.models import TicketLog
from tickets.services import RefundTicketsService
from users.factories import UserFactory


class RefundTicketsServiceTests(TestCase):
  """RefundTicketsService 테스트"""

  def setUp(self):
    self.user = UserFactory()

  def test_refund_default_to_purchased(self):
    """기본 target은 purchased_count에 환불한다."""
    ticket = RefundTicketsService(user=self.user, amount=3).perform()

    self.assertEqual(ticket.purchased_count, 3)
    self.assertEqual(ticket.daily_count, 0)

  def test_refund_to_daily(self):
    """target=daily로 daily_count에 환불한다."""
    ticket = RefundTicketsService(user=self.user, amount=5, target="daily").perform()

    self.assertEqual(ticket.daily_count, 5)
    self.assertEqual(ticket.purchased_count, 0)

  def test_refund_auto_raises_error(self):
    """target=auto는 추가에 사용할 수 없다."""
    with self.assertRaises(ValueError):
      RefundTicketsService(user=self.user, amount=3, target="auto").perform()

  def test_refund_creates_log(self):
    """환불 시 TicketLog가 생성된다."""
    RefundTicketsService(user=self.user, amount=4, reason="오류 환불").perform()

    log = TicketLog.objects.get(user=self.user)
    self.assertEqual(log.action_type, TicketLog.ActionType.REFUND)
    self.assertEqual(log.amount, 4)
    self.assertEqual(log.balance_after, 4)

  def test_refund_zero_raises_error(self):
    """amount가 0이면 ValueError가 발생한다."""
    with self.assertRaises(ValueError):
      RefundTicketsService(user=self.user, amount=0).perform()
