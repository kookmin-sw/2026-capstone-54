from common.exceptions import ValidationException
from django.test import TestCase
from users.models import User
from users.services.user_masking_service import UserMaskingService


class UserMaskingServiceTests(TestCase):
  """UserMaskingService 테스트"""

  def setUp(self):
    self.user = User.objects.create_user(
      email="test@example.com",
      password="password123",
      name="홍길동",
    )

  def test_raises_validation_exception_when_user_kwarg_missing(self):
    """user 인자가 없으면 ValidationException을 발생시킨다."""
    with self.assertRaises(ValidationException):
      UserMaskingService().perform()

  def test_raises_validation_exception_when_user_is_none(self):
    """user가 None이면 ValidationException을 발생시킨다."""
    with self.assertRaises(ValidationException):
      UserMaskingService(user=None).perform()

  def test_name_is_changed_after_masking(self):
    """마스킹 후 이름이 deleted_user+{pk} 형식으로 변경된다."""
    UserMaskingService(user=self.user).perform()
    self.user.refresh_from_db()
    self.assertEqual(self.user.name, f"deleted_user+{self.user.pk}")

  def test_email_is_changed_after_masking(self):
    """마스킹 후 이메일이 deleted_user+{pk}@mefit.chat 형식으로 변경된다."""
    UserMaskingService(user=self.user).perform()
    self.user.refresh_from_db()
    self.assertEqual(self.user.email, f"deleted_user+{self.user.pk}@mefit.chat")

  def test_password_becomes_unusable_after_masking(self):
    """마스킹 후 비밀번호가 사용 불가 상태가 된다."""
    UserMaskingService(user=self.user).perform()
    self.user.refresh_from_db()
    self.assertFalse(self.user.has_usable_password())

  def test_email_confirmed_at_is_cleared_after_masking(self):
    """마스킹 후 email_confirmed_at이 None으로 초기화된다."""
    UserMaskingService(user=self.user).perform()
    self.user.refresh_from_db()
    self.assertIsNone(self.user.email_confirmed_at)

  def test_profile_completed_at_is_cleared_after_masking(self):
    """마스킹 후 profile_completed_at이 None으로 초기화된다."""
    UserMaskingService(user=self.user).perform()
    self.user.refresh_from_db()
    self.assertIsNone(self.user.profile_completed_at)
