from django.test import TestCase
from django.utils import timezone
from users.models import User


class UserModelTests(TestCase):
  """User 모델 테스트"""

  def setUp(self):
    self.user = User.objects.create_user(
      email="test@example.com",
      password="password123",
      name="홍길동",
    )

  def test_유저_생성(self):
    self.assertEqual(self.user.email, "test@example.com")
    self.assertEqual(self.user.name, "홍길동")
    self.assertTrue(self.user.has_usable_password())

  def test_is_email_confirmed_미인증(self):
    self.assertFalse(self.user.is_email_confirmed)

  def test_is_email_confirmed_인증완료(self):
    self.user.email_confirmed_at = timezone.now()
    self.assertTrue(self.user.is_email_confirmed)

  def test_is_profile_completed_미완료(self):
    self.assertFalse(self.user.is_profile_completed)

  def test_is_profile_completed_완료(self):
    self.user.profile_completed_at = timezone.now()
    self.assertTrue(self.user.is_profile_completed)

  def test_소프트_삭제시_deleted_at_설정(self):
    self.user.delete()
    user = User.all_objects.get(pk=self.user.pk)
    self.assertIsNotNone(user.deleted_at)

  def test_소프트_삭제시_개인정보_마스킹(self):
    pk = self.user.pk
    self.user.delete()
    user = User.all_objects.get(pk=pk)
    self.assertEqual(user.name, f"deleted_user+{pk}")
    self.assertEqual(user.email, f"deleted_user+{pk}@mefit.chat")
    self.assertFalse(user.has_usable_password())

  def test_소프트_삭제_후_기본_매니저에서_조회불가(self):
    self.user.delete()
    self.assertFalse(User.objects.filter(pk=self.user.pk).exists())

  def test_소프트_삭제_후_all_objects에서_조회가능(self):
    self.user.delete()
    self.assertTrue(User.all_objects.filter(pk=self.user.pk).exists())

  def test_assign_attributes_정상_동작(self):
    self.user.assign_attributes({
      "name": "새이름",
      "email": "new@example.com",
    })
    self.assertEqual(self.user.name, "새이름")
    self.assertEqual(self.user.email, "new@example.com")

  def test_assign_attributes_잘못된_필드명_에러(self):
    with self.assertRaises(AttributeError):
      self.user.assign_attributes({"invalid_field": "value"})
