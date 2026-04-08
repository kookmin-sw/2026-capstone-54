from common.exceptions import ValidationException
from django.test import TestCase
from users.factories import DEFAULT_PASSWORD, UserFactory
from users.services import ChangePasswordService


class ChangePasswordServiceTests(TestCase):

  def setUp(self):
    self.user = UserFactory(email="changepw@example.com")

  def test_successful_password_change(self):
    """올바른 현재 비밀번호로 비밀번호 변경이 성공한다"""
    new_password = "NewPass123!"
    ChangePasswordService(
      user=self.user,
      old_password=DEFAULT_PASSWORD,
      new_password=new_password,
    ).perform()

    self.user.refresh_from_db()
    self.assertTrue(self.user.check_password(new_password))
    self.assertFalse(self.user.check_password(DEFAULT_PASSWORD))

  def test_wrong_current_password_raises_validation_exception(self):
    """잘못된 현재 비밀번호로 변경 시 ValidationException이 발생한다"""
    with self.assertRaises(ValidationException) as ctx:
      ChangePasswordService(
        user=self.user,
        old_password="WrongPass!",
        new_password="NewPass123!",
      ).perform()

    self.assertIn("old_password", ctx.exception.field_errors)

  def test_short_new_password_raises_validation_exception(self):
    """8자 미만 새 비밀번호로 변경 시 ValidationException이 발생한다"""
    with self.assertRaises(ValidationException) as ctx:
      ChangePasswordService(
        user=self.user,
        old_password=DEFAULT_PASSWORD,
        new_password="Short1!",
      ).perform()

    self.assertIn("new_password", ctx.exception.field_errors)

  def test_same_password_raises_validation_exception(self):
    """현재 비밀번호와 동일한 새 비밀번호로 변경 시 ValidationException이 발생한다"""
    with self.assertRaises(ValidationException) as ctx:
      ChangePasswordService(
        user=self.user,
        old_password=DEFAULT_PASSWORD,
        new_password=DEFAULT_PASSWORD,
      ).perform()

    self.assertIn("new_password", ctx.exception.field_errors)
