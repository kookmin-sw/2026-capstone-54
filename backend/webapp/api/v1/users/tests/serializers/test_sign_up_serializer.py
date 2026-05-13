from api.v1.users.serializers import SignUpSerializer
from django.test import TestCase


class SignUpSerializerTests(TestCase):

  def test_has_name_field(self):
    """name 필드가 존재한다"""
    serializer = SignUpSerializer()
    self.assertIn("name", serializer.fields)

  def test_has_email_field(self):
    """email 필드가 존재한다"""
    serializer = SignUpSerializer()
    self.assertIn("email", serializer.fields)

  def test_has_password1_field(self):
    """password1 필드가 존재한다"""
    serializer = SignUpSerializer()
    self.assertIn("password1", serializer.fields)

  def test_has_password2_field(self):
    """password2 필드가 존재한다"""
    serializer = SignUpSerializer()
    self.assertIn("password2", serializer.fields)

  def test_has_no_username_field(self):
    """username 필드가 없다"""
    serializer = SignUpSerializer()
    self.assertNotIn("username", serializer.fields)

  def test_valid_data_passes_validation(self):
    """유효한 데이터는 검증을 통과한다"""
    data = {
      "name": "홍길동",
      "email": "test@example.com",
      "password1": "StrongPass123!",
      "password2": "StrongPass123!",
    }
    serializer = SignUpSerializer(data=data)
    self.assertTrue(serializer.is_valid())

  def test_password_mismatch_fails_validation(self):
    """password1과 password2가 다르면 검증에 실패한다"""
    data = {
      "name": "홍길동",
      "email": "test@example.com",
      "password1": "StrongPass123!",
      "password2": "DifferentPass456!",
    }
    serializer = SignUpSerializer(data=data)
    self.assertFalse(serializer.is_valid())
    self.assertTrue("non_field_errors" in serializer.errors or "password2" in serializer.errors)
