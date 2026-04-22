from unittest.mock import patch

from common.exceptions import NotFoundException
from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings
from django.utils import timezone
from users.factories import PasswordResetTokenFactory, UserFactory
from users.models import PasswordResetToken
from users.services import RequestPasswordResetService


@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class RequestPasswordResetServiceTests(TestCase):

  def setUp(self):
    self.user = UserFactory(email="resetreq@example.com")

  # ─── 정상 케이스 ───

  @patch("users.tasks.send_password_reset_email_task.SendPasswordResetEmailTask.run")
  def test_creates_new_token_for_existing_user(self, mock_task):
    """존재하는 이메일로 요청 시 새 PasswordResetToken이 생성된다"""
    RequestPasswordResetService(email=self.user.email).perform()

    self.assertEqual(PasswordResetToken.objects.filter(user=self.user).count(), 1)

  @patch("users.tasks.send_password_reset_email_task.SendPasswordResetEmailTask.run")
  def test_invalidates_existing_active_tokens(self, mock_task):
    """새 토큰 생성 시 기존 active 토큰이 무효화된다"""
    old_token = PasswordResetTokenFactory(user=self.user)

    RequestPasswordResetService(email=self.user.email).perform()

    old_token.refresh_from_db()
    self.assertIsNotNone(old_token.used_at)

  @patch("users.tasks.send_password_reset_email_task.SendPasswordResetEmailTask.run")
  def test_dispatches_celery_task(self, mock_task):
    """이메일 발송 Celery 태스크가 호출된다"""
    RequestPasswordResetService(email=self.user.email).perform()

    mock_task.assert_called_once()
    call_kwargs = mock_task.call_args
    self.assertEqual(call_kwargs[1]["user_id"], self.user.id)

  @patch("users.tasks.send_password_reset_email_task.SendPasswordResetEmailTask.run")
  def test_token_has_correct_expiry(self, mock_task):
    """생성된 토큰의 만료 시간이 설정값과 일치한다"""
    before = timezone.now()
    RequestPasswordResetService(email=self.user.email).perform()

    token = PasswordResetToken.objects.get(user=self.user, used_at__isnull=True)
    self.assertGreater(token.expires_at, before)

  @patch("users.tasks.send_password_reset_email_task.SendPasswordResetEmailTask.run")
  def test_already_used_tokens_are_not_affected(self, mock_task):
    """이미 사용된 토큰은 무효화 대상에서 제외된다"""
    used_token = PasswordResetTokenFactory(user=self.user, used_at=timezone.now())
    original_used_at = used_token.used_at

    RequestPasswordResetService(email=self.user.email).perform()

    used_token.refresh_from_db()
    self.assertEqual(used_token.used_at, original_used_at)

  # ─── 반례 ───

  def test_nonexistent_email_raises_not_found(self):
    """존재하지 않는 이메일로 요청 시 NotFoundException이 발생한다"""
    with self.assertRaises(NotFoundException):
      RequestPasswordResetService(email="nonexistent@example.com").perform()

  def test_missing_email_raises_validation_error(self):
    """email 없이 요청 시 ValidationError가 발생한다"""
    with self.assertRaises(ValidationError):
      RequestPasswordResetService().perform()

  def test_none_email_raises_validation_error(self):
    """email이 None이면 ValidationError가 발생한다"""
    with self.assertRaises(ValidationError):
      RequestPasswordResetService(email=None).perform()
