from django.db import IntegrityError
from django.test import TestCase
from tickets.factories import UserTicketFactory
from users.factories import UserFactory


class UserTicketModelTests(TestCase):
  """UserTicket 모델 테스트"""

  def setUp(self):
    self.user = UserFactory()

  def test_create(self):
    """UserTicket이 정상적으로 생성된다."""
    ticket = UserTicketFactory(user=self.user, purchased_count=5)
    self.assertIsNotNone(ticket.pk)
    self.assertEqual(ticket.purchased_count, 5)

  def test_duplicate_user_not_allowed(self):
    """동일 사용자에 대해 중복 생성이 불가능하다."""
    UserTicketFactory(user=self.user)
    with self.assertRaises(IntegrityError):
      UserTicketFactory(user=self.user)

  def test_default_counts_are_zero(self):
    """daily_count와 purchased_count 기본값은 0이다."""
    ticket = UserTicketFactory(user=self.user)
    self.assertEqual(ticket.daily_count, 0)
    self.assertEqual(ticket.purchased_count, 0)

  def test_total_count(self):
    """total_count는 daily_count + purchased_count이다."""
    ticket = UserTicketFactory(user=self.user, daily_count=10, purchased_count=5)
    self.assertEqual(ticket.total_count, 15)

  def test_deduct_from_daily_first(self):
    """deduct()는 daily_count를 먼저 소진한다."""
    ticket = UserTicketFactory(user=self.user, daily_count=3, purchased_count=5)
    ticket.deduct(2)
    self.assertEqual(ticket.daily_count, 1)
    self.assertEqual(ticket.purchased_count, 5)

  def test_deduct_spills_to_purchased(self):
    """daily_count가 부족하면 purchased_count에서 차감한다."""
    ticket = UserTicketFactory(user=self.user, daily_count=2, purchased_count=5)
    ticket.deduct(4)
    self.assertEqual(ticket.daily_count, 0)
    self.assertEqual(ticket.purchased_count, 3)

  def test_deduct_insufficient_raises_error(self):
    """총 보유량보다 많이 차감하면 ValueError가 발생한다."""
    ticket = UserTicketFactory(user=self.user, daily_count=1, purchased_count=1)
    with self.assertRaises(ValueError):
      ticket.deduct(5)

  def test_str(self):
    """__str__은 일일, 구매, 총 티켓 수를 포함한다."""
    ticket = UserTicketFactory(user=self.user, daily_count=3, purchased_count=2)
    result = str(ticket)
    self.assertIn("3", result)
    self.assertIn("2", result)
    self.assertIn("5", result)
