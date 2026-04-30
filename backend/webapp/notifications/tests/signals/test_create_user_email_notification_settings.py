from unittest.mock import patch

from django.test import TestCase
from notifications.models import UserEmailNotificationSettings
from users.factories import UserFactory


class CreateUserEmailNotificationSettingsSignalTests(TestCase):
  """User 생성 시 UserEmailNotificationSettings 자동 생성 시그널 테스트."""

  @patch(
    "notifications.signals.create_user_email_notification_settings.transaction.on_commit",
    side_effect=lambda cb, using=None: cb(),
  )
  def test_creates_settings_on_user_creation(self, _mock_on_commit):
    user = UserFactory()

    self.assertTrue(UserEmailNotificationSettings.objects.filter(user=user).exists())
    self.assertEqual(UserEmailNotificationSettings.objects.filter(user=user).count(), 1)

  @patch(
    "notifications.signals.create_user_email_notification_settings.transaction.on_commit",
    side_effect=lambda cb, using=None: cb(),
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
    side_effect=lambda cb, using=None: cb(),
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
    side_effect=lambda cb, using=None: cb(),
  )
  def test_does_not_create_settings_on_raw_save(self, _mock_on_commit):
    """fixture 로딩 (raw=True) 시에는 시그널이 건너뛴다."""
    from django.db.models.signals import post_save
    from users.models import User

    user = UserFactory.build(email="raw-fixture@example.com")
    user.save_base(raw=True, force_insert=True)
    post_save.send(sender=User, instance=user, created=True, raw=True, using="default")

    self.assertFalse(UserEmailNotificationSettings.objects.filter(user=user).exists())

  @patch(
    "notifications.signals.create_user_email_notification_settings.transaction.on_commit",
    side_effect=lambda cb, using=None: cb(),
  )
  def test_idempotent_on_integrity_error(self, _mock_on_commit):
    """동시 트랜잭션이 이미 row 를 만든 경우에도 IntegrityError 가 swallow 된다."""
    user = UserFactory()
    initial_count = UserEmailNotificationSettings.objects.filter(user=user).count()
    self.assertEqual(initial_count, 1)

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
