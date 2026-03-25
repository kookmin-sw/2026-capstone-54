from api.v1.users.serializers import SignInSerializer
from django.test import TestCase


class SignInSerializerTests(TestCase):

  def test_has_email_field(self):
    """email 필드가 존재한다"""
    serializer = SignInSerializer()
    self.assertIn("email", serializer.fields)

  def test_has_password_field(self):
    """password 필드가 존재한다"""
    serializer = SignInSerializer()
    self.assertIn("password", serializer.fields)

  def test_has_no_username_field(self):
    """username 필드가 없다"""
    serializer = SignInSerializer()
    self.assertNotIn("username", serializer.fields)

  def test_valid_data_passes_validation(self):
    """유효한 데이터는 검증을 통과한다"""
    data = {"email": "test@example.com", "password": "somepassword"}
    serializer = SignInSerializer(data=data)
    self.assertTrue(serializer.is_valid())
