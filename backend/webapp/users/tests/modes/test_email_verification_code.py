from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from users.factories import EmailVerificationCodeFactory, UserFactory
from users.models import EmailVerificationCode


class EmailVerificationCodeModelTests(TestCase):

  def setUp(self):
    self.user = UserFactory()

  def _make_code(self, code="ABC123", minutes=10, used=False):
    obj = EmailVerificationCodeFactory(
      user=self.user,
      code=code,
      expires_at=timezone.now() + timedelta(minutes=minutes),
    )
    if used:
      obj.used_at = timezone.now()
      obj.save(update_fields=["used_at"])
    return obj

  def test_create_email_verification_code(self):
    """EmailVerificationCode 모델을 생성할 수 있다"""
    obj = self._make_code()
    self.assertIsNotNone(obj.pk)

  def test_code_field_max_length(self):
    """code 필드는 최대 6자리다"""
    field = EmailVerificationCode._meta.get_field("code")
    self.assertEqual(field.max_length, 6)

  def test_is_used_defaults_to_false(self):
    """used_at이 없으면 is_used는 False다"""
    obj = EmailVerificationCodeFactory(user=self.user, code="XYZ789")
    self.assertFalse(obj.is_used)
    self.assertIsNone(obj.used_at)

  def test_user_foreign_key(self):
    """user FK가 올바르게 연결된다"""
    obj = self._make_code()
    self.assertEqual(obj.user, self.user)

  def test_expires_at_is_set(self):
    """expires_at이 설정된다"""
    obj = self._make_code(minutes=10)
    self.assertIsNotNone(obj.expires_at)
    self.assertGreater(obj.expires_at, timezone.now())

  def test_mark_as_used(self):
    """used_at을 설정하면 is_used가 True가 된다"""
    obj = self._make_code()
    obj.used_at = timezone.now()
    obj.save(update_fields=["used_at"])
    obj.refresh_from_db()
    self.assertTrue(obj.is_used)
    self.assertIsNotNone(obj.used_at)

  def test_expired_code_detection(self):
    """만료된 코드는 expires_at이 현재 시각보다 이전이다"""
    obj = self._make_code(minutes=-1)
    self.assertLess(obj.expires_at, timezone.now())
