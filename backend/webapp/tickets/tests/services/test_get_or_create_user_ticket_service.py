from django.test import TestCase
from tickets.factories import UserTicketFactory
from tickets.models import UserTicket
from tickets.services import GetOrCreateUserTicketService
from users.factories import UserFactory


class GetOrCreateUserTicketServiceTests(TestCase):
  """GetOrCreateUserTicketService 테스트"""

  def setUp(self):
    self.user = UserFactory()

  def test_create_when_not_exists(self):
    """UserTicket이 없으면 count=0으로 새로 생성하여 반환한다."""
    ticket = GetOrCreateUserTicketService(user=self.user).perform()

    self.assertIsNotNone(ticket.pk)
    self.assertEqual(ticket.user, self.user)
    self.assertEqual(ticket.count, 0)
    self.assertEqual(UserTicket.objects.count(), 1)

  def test_return_existing(self):
    """이미 UserTicket이 존재하면 그대로 반환한다."""
    existing = UserTicketFactory(user=self.user, count=10)
    ticket = GetOrCreateUserTicketService(user=self.user).perform()

    self.assertEqual(ticket.pk, existing.pk)
    self.assertEqual(ticket.count, 10)
    self.assertEqual(UserTicket.objects.count(), 1)

  def test_lock_option(self):
    """lock=True를 전달해도 정상적으로 동작한다."""
    ticket = GetOrCreateUserTicketService(user=self.user, lock=True).perform()

    self.assertIsNotNone(ticket.pk)
    self.assertEqual(ticket.count, 0)

  def test_lock_with_existing(self):
    """lock=True로 기존 레코드를 조회해도 정상 반환한다."""
    UserTicketFactory(user=self.user, count=5)
    ticket = GetOrCreateUserTicketService(user=self.user, lock=True).perform()

    self.assertEqual(ticket.count, 5)
