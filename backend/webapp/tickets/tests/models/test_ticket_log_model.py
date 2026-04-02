from django.test import TestCase
from tickets.models import TicketLog
from users.factories import UserFactory


class TicketLogModelTests(TestCase):
  """TicketLog 모델 테스트"""

  def setUp(self):
    self.user = UserFactory()

  def test_create(self):
    """TicketLog가 정상적으로 생성된다."""
    log = TicketLog.objects.create(
      user=self.user,
      action_type=TicketLog.ActionType.GRANT,
      amount=5,
      balance_after=5,
    )
    self.assertIsNotNone(log.pk)
    self.assertEqual(log.action_type, TicketLog.ActionType.GRANT)

  def test_str(self):
    """__str__은 액션 타입과 변동 수량을 포함한다."""
    log = TicketLog.objects.create(
      user=self.user,
      action_type=TicketLog.ActionType.USE,
      amount=-2,
      balance_after=3,
    )
    result = str(log)
    self.assertIn("사용", result)
    self.assertIn("-2", result)
    self.assertIn("3", result)

  def test_default_reason_and_metadata(self):
    """reason과 metadata의 기본값이 올바르다."""
    log = TicketLog.objects.create(
      user=self.user,
      action_type=TicketLog.ActionType.GRANT,
      amount=1,
      balance_after=1,
    )
    self.assertEqual(log.reason, "")
    self.assertEqual(log.metadata, {})
