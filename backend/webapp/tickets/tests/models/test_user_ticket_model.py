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
    ticket = UserTicketFactory(user=self.user, count=5)
    self.assertIsNotNone(ticket.pk)
    self.assertEqual(ticket.count, 5)

  def test_duplicate_user_not_allowed(self):
    """동일 사용자에 대해 중복 생성이 불가능하다."""
    UserTicketFactory(user=self.user)
    with self.assertRaises(IntegrityError):
      UserTicketFactory(user=self.user)

  def test_default_count_is_zero(self):
    """count 기본값은 0이다."""
    ticket = UserTicketFactory(user=self.user)
    self.assertEqual(ticket.count, 0)

  def test_str(self):
    """__str__은 사용자와 티켓 수를 포함한다."""
    ticket = UserTicketFactory(user=self.user, count=3)
    result = str(ticket)
    self.assertIn("3", result)
