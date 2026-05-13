from django.test import TestCase
from tickets.factories import UserTicketFactory
from tickets.models import TicketLog
from tickets.services import UseTicketsService
from users.factories import UserFactory


class UseTicketsServiceTests(TestCase):
  """UseTicketsService 테스트"""

  def setUp(self):
    self.user = UserFactory()

  def test_use_default_auto_deducts_daily_first(self):
    """기본 target=auto로 daily_count를 먼저 차감한다."""
    UserTicketFactory(user=self.user, daily_count=5, purchased_count=3)
    ticket = UseTicketsService(user=self.user, amount=3).perform()

    self.assertEqual(ticket.daily_count, 2)
    self.assertEqual(ticket.purchased_count, 3)

  def test_use_auto_spills_to_purchased(self):
    """auto에서 daily가 부족하면 purchased에서 차감한다."""
    UserTicketFactory(user=self.user, daily_count=2, purchased_count=5)
    ticket = UseTicketsService(user=self.user, amount=4).perform()

    self.assertEqual(ticket.daily_count, 0)
    self.assertEqual(ticket.purchased_count, 3)

  def test_use_auto_daily_zero_uses_purchased(self):
    """daily가 0일 때 purchased에서 차감한다."""
    UserTicketFactory(user=self.user, daily_count=0, purchased_count=30)
    ticket = UseTicketsService(user=self.user, amount=5).perform()

    self.assertEqual(ticket.daily_count, 0)
    self.assertEqual(ticket.purchased_count, 25)
    self.assertEqual(ticket.total_count, 25)

  def test_use_target_daily_only(self):
    """target=daily로 daily_count만 차감한다."""
    UserTicketFactory(user=self.user, daily_count=5, purchased_count=3)
    ticket = UseTicketsService(user=self.user, amount=2, target="daily").perform()

    self.assertEqual(ticket.daily_count, 3)
    self.assertEqual(ticket.purchased_count, 3)

  def test_use_target_purchased_only(self):
    """target=purchased로 purchased_count만 차감한다."""
    UserTicketFactory(user=self.user, daily_count=5, purchased_count=3)
    ticket = UseTicketsService(user=self.user, amount=2, target="purchased").perform()

    self.assertEqual(ticket.daily_count, 5)
    self.assertEqual(ticket.purchased_count, 1)

  def test_use_creates_log(self):
    """티켓 사용 시 TicketLog가 생성된다."""
    UserTicketFactory(user=self.user, daily_count=5)
    UseTicketsService(user=self.user, amount=2).perform()

    log = TicketLog.objects.get(user=self.user)
    self.assertEqual(log.action_type, TicketLog.ActionType.USE)
    self.assertEqual(log.amount, -2)

  def test_use_without_ticket_raises_error(self):
    """UserTicket이 없으면 ValueError가 발생한다."""
    with self.assertRaises(ValueError):
      UseTicketsService(user=self.user, amount=1).perform()

  def test_use_insufficient_raises_error(self):
    """보유 수량보다 많이 사용하면 ValueError가 발생한다."""
    UserTicketFactory(user=self.user, daily_count=1, purchased_count=1)
    with self.assertRaises(ValueError):
      UseTicketsService(user=self.user, amount=5).perform()

  def test_use_zero_raises_error(self):
    """amount가 0이면 ValueError가 발생한다."""
    UserTicketFactory(user=self.user, daily_count=5)
    with self.assertRaises(ValueError):
      UseTicketsService(user=self.user, amount=0).perform()
