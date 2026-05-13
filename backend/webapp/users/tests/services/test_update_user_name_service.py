from django.core.exceptions import ValidationError
from django.test import TestCase
from users.factories import UserFactory
from users.services import UpdateUserNameService


class UpdateUserNameServiceTests(TestCase):

  def setUp(self):
    self.user = UserFactory(email="updatename@example.com", name="OldName")

  def test_successful_name_update(self):
    """유효한 name으로 호출하면 사용자의 name이 변경된다."""
    new_name = "NewName"

    UpdateUserNameService(user=self.user, name=new_name).perform()

    self.user.refresh_from_db()
    self.assertEqual(self.user.name, new_name)

  def test_returns_updated_user(self):
    """perform() 은 수정된 user 인스턴스를 반환한다."""
    new_name = "ReturnedName"

    result = UpdateUserNameService(user=self.user, name=new_name).perform()

    self.assertEqual(result.pk, self.user.pk)
    self.assertEqual(result.name, new_name)

  def test_other_fields_unchanged(self):
    """name 외 다른 필드는 변경되지 않는다."""
    original_email = self.user.email
    original_password_hash = self.user.password

    UpdateUserNameService(user=self.user, name="DifferentName").perform()

    self.user.refresh_from_db()
    self.assertEqual(self.user.email, original_email)
    self.assertEqual(self.user.password, original_password_hash)

  def test_missing_name_raises_validation_error(self):
    """name kwargs 없이 호출하면 ValidationError가 발생한다."""
    with self.assertRaises(ValidationError):
      UpdateUserNameService(user=self.user).perform()

  def test_none_name_raises_validation_error(self):
    """name=None 으로 호출하면 ValidationError가 발생한다."""
    with self.assertRaises(ValidationError):
      UpdateUserNameService(user=self.user, name=None).perform()
