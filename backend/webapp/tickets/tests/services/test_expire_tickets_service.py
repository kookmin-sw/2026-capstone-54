from django.test import TestCase
from tickets.factories import UserTicketFactory
from tickets.models import TicketLog
from tickets.services import ExpireTicketsService
from users.factories import UserFactory


class ExpireTicketsServiceTests(TestCase):
  """ExpireTicketsService 테스트"""

  def setUp(self):
    self.user = UserFactory()

  def test_expire_default_purchased(self):
    """기본 target=purchased로 purchased_count를 차감한다."""
    UserTicketFactory(user=self.user, daily_count=10, purchased_count=5)
    ticket = ExpireTicketsService(user=self.user, amount=3).perform()

    self.assertEqual(ticket.daily_count, 10)
    self.assertEqual(ticket.purchased_count, 2)

  def test_expire_target_daily(self):
    """target=daily로 daily_count를 차감한다."""
    UserTicketFactory(user=self.user, daily_count=10, purchased_count=5)
    ticket = ExpireTicketsService(user=self.user, amount=3, target="daily").perform()

    self.assertEqual(ticket.daily_count, 7)
    self.assertEqual(ticket.purchased_count, 5)

  def test_expire_target_auto(self):
    """target=auto로 daily를 먼저 소진하고 purchased에서 차감한다."""
    UserTicketFactory(user=self.user, daily_count=2, purchased_count=5)
    ticket = ExpireTicketsService(user=self.user, amount=4, target="auto").perform()

    self.assertEqual(ticket.daily_count, 0)
    self.assertEqual(ticket.purchased_count, 3)

  def test_expire_creates_log(self):
    """만료 처리 시 TicketLog가 생성된다."""
    UserTicketFactory(user=self.user, purchased_count=5)
    ExpireTicketsService(user=self.user, amount=2).perform()

    log = TicketLog.objects.get(user=self.user)
    self.assertEqual(log.action_type, TicketLog.ActionType.EXPIRE)
    self.assertEqual(log.amount, -2)

  def test_expire_without_ticket_raises_error(self):
    """UserTicket이 없으면 ValueError가 발생한다."""
    with self.assertRaises(ValueError):
      ExpireTicketsService(user=self.user, amount=1).perform()

  def test_expire_insufficient_raises_error(self):
    """대상 수량보다 많이 만료하면 ValueError가 발생한다."""
    UserTicketFactory(user=self.user, purchased_count=2)
    with self.assertRaises(ValueError):
      ExpireTicketsService(user=self.user, amount=5).perform()

  def test_expire_zero_raises_error(self):
    """amount가 0이면 ValueError가 발생한다."""
    UserTicketFactory(user=self.user, purchased_count=5)
    with self.assertRaises(ValueError):
      ExpireTicketsService(user=self.user, amount=0).perform()
