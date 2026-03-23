from datetime import timedelta

from common.exceptions import UnauthorizedException, ValidationException
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import EmailVerificationCode, User
from users.services import (
  ResendVerifyEmailService,
  SignInService,
  SignOutService,
  SignUpService,
  VerifyEmailService,
)


@override_settings(
  EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
  CELERY_TASK_ALWAYS_EAGER=True,
)
class SignUpServiceTests(TestCase):

  def test_creates_user(self):
    """SignUpService 실행 시 User가 생성된다"""
    SignUpService(email="signup@example.com", password="Pass123!", name="유저").perform()
    self.assertTrue(User.objects.filter(email="signup@example.com").exists())

  def test_returns_refresh_token(self):
    """SignUpService는 RefreshToken을 반환한다"""
    token = SignUpService(email="signup2@example.com", password="Pass123!", name="유저").perform()
    self.assertIsNotNone(token)
    self.assertTrue(hasattr(token, "access_token"))

  def test_sends_verification_email(self):
    """SignUpService 실행 시 EmailVerificationCode가 생성된다"""
    SignUpService(email="signup3@example.com", password="Pass123!", name="유저").perform()
    user = User.objects.get(email="signup3@example.com")
    self.assertTrue(EmailVerificationCode.objects.filter(user=user).exists())


class SignInServiceTests(TestCase):

  def setUp(self):
    self.user = User.objects.create_user(email="signin@example.com", password="Pass123!", name="유저")

  def test_valid_credentials_returns_token(self):
    """올바른 자격 증명으로 로그인하면 토큰이 반환된다"""
    token = SignInService(email="signin@example.com", password="Pass123!").perform()
    self.assertIsNotNone(token)

  def test_wrong_password_raises_unauthorized(self):
    """잘못된 비밀번호로 로그인하면 UnauthorizedException이 발생한다"""
    with self.assertRaises(UnauthorizedException):
      SignInService(email="signin@example.com", password="WrongPass!").perform()

  def test_nonexistent_email_raises_unauthorized(self):
    """존재하지 않는 이메일로 로그인하면 UnauthorizedException이 발생한다"""
    with self.assertRaises(UnauthorizedException):
      SignInService(email="nobody@example.com", password="Pass123!").perform()


class SignOutServiceTests(TestCase):

  def setUp(self):
    self.user = User.objects.create_user(email="signout@example.com", password="Pass123!", name="유저")
    self.other_user = User.objects.create_user(email="other@example.com", password="Pass123!", name="다른유저")

  def test_valid_token_is_blacklisted(self):
    """유효한 refresh 토큰으로 로그아웃하면 토큰이 블랙리스트에 등록된다"""
    token = RefreshToken.for_user(self.user)
    SignOutService(user=self.user, refresh_token=str(token)).perform()
    # 재사용 시 ValidationException 발생해야 한다
    with self.assertRaises(ValidationException):
      SignOutService(user=self.user, refresh_token=str(token)).perform()

  def test_invalid_token_raises_validation_error(self):
    """유효하지 않은 토큰으로 로그아웃하면 ValidationException이 발생한다"""
    with self.assertRaises(ValidationException):
      SignOutService(user=self.user, refresh_token="not.a.valid.token").perform()

  def test_other_users_token_raises_validation_error(self):
    """다른 사용자의 refresh 토큰으로 로그아웃 시도하면 ValidationException이 발생한다"""
    other_token = RefreshToken.for_user(self.other_user)
    with self.assertRaises(ValidationException):
      SignOutService(user=self.user, refresh_token=str(other_token)).perform()


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class VerifyEmailServiceTests(TestCase):

  def setUp(self):
    self.user = User.objects.create_user(email="verify@example.com", password="Pass123!", name="유저")
    self.code_obj = EmailVerificationCode.objects.create(
      user=self.user,
      code="ABC123",
      expires_at=timezone.now() + timedelta(minutes=10),
    )

  def test_valid_code_sets_email_confirmed_at(self):
    """유효한 코드로 인증하면 email_confirmed_at이 설정된다"""
    VerifyEmailService(user=self.user, code="ABC123").perform()
    self.user.refresh_from_db()
    self.assertIsNotNone(self.user.email_confirmed_at)

  def test_valid_code_marks_as_used(self):
    """유효한 코드로 인증하면 used_at이 설정된다"""
    VerifyEmailService(user=self.user, code="ABC123").perform()
    self.code_obj.refresh_from_db()
    self.assertTrue(self.code_obj.is_used)
    self.assertIsNotNone(self.code_obj.used_at)

  def test_wrong_code_raises_validation_error(self):
    """잘못된 코드로 인증하면 ValidationException이 발생한다"""
    with self.assertRaises(ValidationException):
      VerifyEmailService(user=self.user, code="XXXXXX").perform()

  def test_expired_code_raises_validation_error(self):
    """만료된 코드로 인증하면 ValidationException이 발생한다"""
    self.code_obj.expires_at = timezone.now() - timedelta(minutes=1)
    self.code_obj.save()
    with self.assertRaises(ValidationException):
      VerifyEmailService(user=self.user, code="ABC123").perform()

  def test_already_verified_raises_validation_error(self):
    """이미 인증된 이메일로 재인증 시도하면 ValidationException이 발생한다"""
    self.user.email_confirmed_at = timezone.now()
    self.user.save()
    with self.assertRaises(ValidationException):
      VerifyEmailService(user=self.user, code="ABC123").perform()


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class ResendVerifyEmailServiceTests(TestCase):

  def setUp(self):
    self.user = User.objects.create_user(email="resend@example.com", password="Pass123!", name="유저")
    self.old_code = EmailVerificationCode.objects.create(
      user=self.user,
      code="OLD123",
      expires_at=timezone.now() - timedelta(minutes=1),  # 이미 만료된 코드
    )

  def test_old_codes_are_invalidated(self):
    """재발송 시 기존 미사용 코드가 만료 처리된다"""
    ResendVerifyEmailService(user=self.user).perform()
    self.old_code.refresh_from_db()
    self.assertTrue(self.old_code.is_used)

  def test_new_code_is_created(self):
    """재발송 시 새로운 코드가 생성된다"""
    ResendVerifyEmailService(user=self.user).perform()
    new_codes = EmailVerificationCode.objects.filter(user=self.user, used_at__isnull=True).exclude(id=self.old_code.id)
    self.assertTrue(new_codes.exists())

  def test_already_verified_raises_validation_error(self):
    """이미 인증된 이메일로 재발송 요청하면 ValidationException이 발생한다"""
    self.user.email_confirmed_at = timezone.now()
    self.user.save()
    with self.assertRaises(ValidationException):
      ResendVerifyEmailService(user=self.user).perform()
