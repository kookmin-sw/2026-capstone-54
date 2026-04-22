import uuid
from datetime import timedelta

from common.exceptions import NotFoundException, ValidationException
from django.test import TestCase
from django.utils import timezone
from users.factories import DEFAULT_PASSWORD, PasswordResetTokenFactory, UserFactory
from users.services import ConfirmPasswordResetService


class ConfirmPasswordResetServiceTests(TestCase):

  def setUp(self):
    self.user = UserFactory(email="reset@example.com")
    self.token = PasswordResetTokenFactory(user=self.user)
    self.new_password = "NewSecurePass123!"

  # ─── 정상 케이스 ───

  def test_successful_password_reset(self):
    """유효한 토큰과 새 비밀번호로 비밀번호가 정상 변경된다"""
    ConfirmPasswordResetService(
      token=self.token.token,
      new_password=self.new_password,
    ).perform()

    self.user.refresh_from_db()
    self.assertTrue(self.user.check_password(self.new_password))
    self.assertFalse(self.user.check_password(DEFAULT_PASSWORD))

  def test_token_marked_as_used_after_reset(self):
    """비밀번호 변경 후 토큰의 used_at이 설정된다"""
    ConfirmPasswordResetService(
      token=self.token.token,
      new_password=self.new_password,
    ).perform()

    self.token.refresh_from_db()
    self.assertIsNotNone(self.token.used_at)

  # ─── 토큰 관련 반례 ───

  def test_nonexistent_token_raises_not_found(self):
    """존재하지 않는 UUID 토큰으로 요청 시 NotFoundException이 발생한다"""
    fake_token = uuid.uuid4()

    with self.assertRaises(NotFoundException):
      ConfirmPasswordResetService(
        token=fake_token,
        new_password=self.new_password,
      ).perform()

  def test_already_used_token_raises_validation_error(self):
    """이미 사용된 토큰으로 요청 시 ValidationException이 발생한다"""
    self.token.used_at = timezone.now()
    self.token.save(update_fields=["used_at"])

    with self.assertRaises(ValidationException) as ctx:
      ConfirmPasswordResetService(
        token=self.token.token,
        new_password=self.new_password,
      ).perform()

    self.assertIn("token", ctx.exception.field_errors)

  def test_expired_token_raises_validation_error(self):
    """만료된 토큰으로 요청 시 ValidationException이 발생한다"""
    self.token.expires_at = timezone.now() - timedelta(minutes=1)
    self.token.save(update_fields=["expires_at"])

    with self.assertRaises(ValidationException) as ctx:
      ConfirmPasswordResetService(
        token=self.token.token,
        new_password=self.new_password,
      ).perform()

    self.assertIn("token", ctx.exception.field_errors)

  # ─── 비밀번호 유효성 반례 ───

  def test_short_password_raises_validation_error(self):
    """8자 미만 비밀번호로 요청 시 ValidationException이 발생한다"""
    with self.assertRaises(ValidationException) as ctx:
      ConfirmPasswordResetService(
        token=self.token.token,
        new_password="Short1!",
      ).perform()

    self.assertIn("new_password", ctx.exception.field_errors)

  def test_numeric_only_password_raises_validation_error(self):
    """숫자로만 구성된 비밀번호로 요청 시 ValidationException이 발생한다"""
    with self.assertRaises(ValidationException) as ctx:
      ConfirmPasswordResetService(
        token=self.token.token,
        new_password="12345678",
      ).perform()

    self.assertIn("new_password", ctx.exception.field_errors)

  def test_common_password_raises_validation_error(self):
    """너무 흔한 비밀번호로 요청 시 ValidationException이 발생한다"""
    with self.assertRaises(ValidationException) as ctx:
      ConfirmPasswordResetService(
        token=self.token.token,
        new_password="password123",
      ).perform()

    self.assertIn("new_password", ctx.exception.field_errors)

  # ─── 필수값 누락 반례 ───

  def test_missing_token_raises_error(self):
    """token 없이 요청 시 에러가 발생한다"""
    from django.core.exceptions import ValidationError

    with self.assertRaises(ValidationError):
      ConfirmPasswordResetService(new_password=self.new_password, ).perform()

  def test_missing_password_raises_error(self):
    """new_password 없이 요청 시 에러가 발생한다"""
    from django.core.exceptions import ValidationError

    with self.assertRaises(ValidationError):
      ConfirmPasswordResetService(token=self.token.token, ).perform()

  # ─── 사용된 토큰 재사용 방지 ───

  def test_reusing_token_after_success_raises_validation_error(self):
    """비밀번호 변경 성공 후 같은 토큰으로 재요청 시 ValidationException이 발생한다"""
    ConfirmPasswordResetService(
      token=self.token.token,
      new_password=self.new_password,
    ).perform()

    with self.assertRaises(ValidationException) as ctx:
      ConfirmPasswordResetService(
        token=self.token.token,
        new_password="AnotherPass456!",
      ).perform()

    self.assertIn("token", ctx.exception.field_errors)
