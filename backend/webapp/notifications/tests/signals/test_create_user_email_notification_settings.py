from unittest.mock import patch

from django.test import TestCase
from notifications.models import UserEmailNotificationSettings
from users.factories import UserFactory


class CreateUserEmailNotificationSettingsSignalTests(TestCase):
  """User 생성 시 UserEmailNotificationSettings 자동 생성 시그널 테스트."""

  @patch(
    "notifications.signals.create_user_email_notification_settings.transaction.on_commit",
    side_effect=lambda cb: cb(),
  )
  def test_creates_settings_on_user_creation(self, _mock_on_commit):
    user = UserFactory()

    self.assertTrue(UserEmailNotificationSettings.objects.filter(user=user).exists())
    self.assertEqual(UserEmailNotificationSettings.objects.filter(user=user).count(), 1)

  @patch(
    "notifications.signals.create_user_email_notification_settings.transaction.on_commit",
    side_effect=lambda cb: cb(),
  )
  def test_default_consent_is_opted_in_for_all_notifications(self, _mock_on_commit):
    """신규 가입자는 모든 알림에 대해 동의 상태로 시작한다 (사업 정책)."""
    from notifications.enums import EmailNotificationType

    user = UserFactory()
    settings = UserEmailNotificationSettings.objects.get(user=user)

    for member in EmailNotificationType:
      with self.subTest(notification_type=member.value):
        self.assertTrue(
          settings.is_opted_in(member.value),
          f"{member.value} should be opted-in by default",
        )
        self.assertIsNotNone(getattr(settings, EmailNotificationType.opted_in_field(member.value)))
        self.assertIsNone(getattr(settings, EmailNotificationType.opted_out_field(member.value)))

  @patch(
    "notifications.signals.create_user_email_notification_settings.transaction.on_commit",
    side_effect=lambda cb: cb(),
  )
  def test_does_not_recreate_settings_on_user_update(self, _mock_on_commit):
    user = UserFactory()
    initial_settings_id = UserEmailNotificationSettings.objects.get(user=user).id

    user.name = "updated-name"
    user.save(update_fields=["name", "updated_at"])

    settings_qs = UserEmailNotificationSettings.objects.filter(user=user)
    self.assertEqual(settings_qs.count(), 1)
    self.assertEqual(settings_qs.first().id, initial_settings_id)

  @patch(
    "notifications.signals.create_user_email_notification_settings.transaction.on_commit",
    side_effect=lambda cb: cb(),
  )
  def test_does_not_create_settings_on_raw_signal(self, _mock_on_commit):
    """fixture 로딩(raw=True) 케이스에서는 시그널이 건너뛴다."""
    from notifications.signals.create_user_email_notification_settings import (
      create_user_email_notification_settings_on_user_created,
    )
    from users.models import User

    user = UserFactory()
    initial_count = UserEmailNotificationSettings.objects.count()

    create_user_email_notification_settings_on_user_created(
      sender=User,
      instance=user,
      created=True,
      raw=True,
      using="default",
    )

    self.assertEqual(UserEmailNotificationSettings.objects.count(), initial_count)

  @patch(
    "notifications.signals.create_user_email_notification_settings.transaction.on_commit",
    side_effect=lambda cb: cb(),
  )
  def test_idempotent_on_repeat_signal(self, _mock_on_commit):
    """동일 user 에 대해 시그널이 재호출되어도 row 가 추가 생성되지 않는다 (race 방어)."""
    user = UserFactory()
    self.assertEqual(UserEmailNotificationSettings.objects.filter(user=user).count(), 1)

    from notifications.signals.create_user_email_notification_settings import (
      create_user_email_notification_settings_on_user_created,
    )
    from users.models import User

    create_user_email_notification_settings_on_user_created(
      sender=User,
      instance=user,
      created=True,
      raw=False,
      using="default",
    )

    self.assertEqual(UserEmailNotificationSettings.objects.filter(user=user).count(), 1)
