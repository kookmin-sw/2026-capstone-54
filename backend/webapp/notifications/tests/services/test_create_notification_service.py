from unittest.mock import AsyncMock, MagicMock, patch

from django.test import TestCase
from notifications.models import Notification
from notifications.services import CreateNotificationService
from users.factories import UserFactory


class CreateNotificationServiceTests(TestCase):

  def setUp(self):
    self.user = UserFactory()

  def _make_mock_layer(self):
    """채널 레이어 mock 객체를 생성한다."""
    mock_layer = MagicMock()
    mock_layer.group_send = AsyncMock()
    return mock_layer

  @patch("notifications.services.create_notification_service.get_channel_layer")
  def test_returns_notification_instance(self, mock_get_channel_layer):
    """perform()이 저장된 Notification 인스턴스를 반환한다."""
    mock_get_channel_layer.return_value = self._make_mock_layer()
    result = CreateNotificationService(
      user=self.user,
      message="알림 메시지",
      category=Notification.Category.SYSTEM,
    ).perform()
    self.assertIsInstance(result, Notification)
    self.assertIsNotNone(result.pk)

  @patch("notifications.services.create_notification_service.get_channel_layer")
  def test_creates_db_record_with_correct_fields(self, mock_get_channel_layer):
    """perform() 호출 시 올바른 필드 값으로 DB 레코드가 생성된다."""
    mock_get_channel_layer.return_value = self._make_mock_layer()
    CreateNotificationService(
      user=self.user,
      message="DB 저장 테스트",
      category=Notification.Category.INTERVIEW,
    ).perform()
    self.assertTrue(
      Notification.objects.filter(
        user=self.user,
        message="DB 저장 테스트",
        category=Notification.Category.INTERVIEW,
      ).exists()
    )

  @patch("notifications.services.create_notification_service.get_channel_layer")
  def test_calls_group_send_with_correct_payload(self, mock_get_channel_layer):
    """perform() 호출 시 올바른 페이로드로 group_send가 호출된다."""
    mock_layer = self._make_mock_layer()
    mock_get_channel_layer.return_value = mock_layer

    notification = CreateNotificationService(
      user=self.user,
      message="push 테스트",
      category=Notification.Category.SYSTEM,
    ).perform()

    mock_layer.group_send.assert_called_once()
    call_args = mock_layer.group_send.call_args
    group_name = call_args[0][0]
    payload = call_args[0][1]

    self.assertEqual(group_name, f"user_{self.user.pk}")
    self.assertEqual(payload["type"], "user.message")
    self.assertEqual(payload["payload"]["id"], notification.pk)
    self.assertEqual(payload["payload"]["message"], "push 테스트")
    self.assertEqual(payload["payload"]["category"], Notification.Category.SYSTEM)

  @patch("notifications.services.create_notification_service.get_channel_layer")
  def test_works_without_notifiable(self, mock_get_channel_layer):
    """notifiable=None 으로 알림을 생성할 수 있다."""
    mock_get_channel_layer.return_value = self._make_mock_layer()
    notification = CreateNotificationService(
      user=self.user,
      message="notifiable 없음",
      category=Notification.Category.SYSTEM,
      notifiable=None,
    ).perform()
    self.assertIsNone(notification.notifiable_type)
    self.assertIsNone(notification.notifiable_id)

  @patch("notifications.services.create_notification_service.get_channel_layer")
  def test_works_with_notifiable_object(self, mock_get_channel_layer):
    """notifiable 객체를 전달하면 notifiable_type과 notifiable_id가 설정된다."""
    mock_get_channel_layer.return_value = self._make_mock_layer()
    other_user = UserFactory()
    notification = CreateNotificationService(
      user=self.user,
      message="notifiable 있음",
      category=Notification.Category.SYSTEM,
      notifiable=other_user,
    ).perform()
    self.assertIsNotNone(notification.notifiable_type)
    self.assertEqual(notification.notifiable_id, str(other_user.pk))
    self.assertEqual(notification.notifiable, other_user)

  @patch("notifications.services.create_notification_service.get_channel_layer")
  def test_ws_payload_notifiable_type_is_none_when_no_notifiable(self, mock_get_channel_layer):
    """notifiable 없을 때 WS 페이로드의 notifiableType이 None이다."""
    mock_layer = self._make_mock_layer()
    mock_get_channel_layer.return_value = mock_layer

    CreateNotificationService(
      user=self.user,
      message="notifiable 없는 push",
      category=Notification.Category.SYSTEM,
    ).perform()

    payload = mock_layer.group_send.call_args[0][1]["payload"]
    self.assertIsNone(payload["notifiableType"])
    self.assertIsNone(payload["notifiableId"])
