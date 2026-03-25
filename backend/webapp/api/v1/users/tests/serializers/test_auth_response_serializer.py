from api.v1.users.serializers import AuthResponseSerializer, UserMeSerializer
from django.test import TestCase
from users.models import User


class AuthResponseSerializerTests(TestCase):

  def test_serializes_valid_data(self):
    """유효한 데이터를 직렬화한다"""
    data = {
      "access": "access-token",
      "refresh": "refresh-token",
      "is_email_confirmed": True,
      "is_profile_completed": False,
    }
    serializer = AuthResponseSerializer(data=data)
    self.assertTrue(serializer.is_valid())
    self.assertEqual(serializer.validated_data["access"], "access-token")

  def test_invalid_when_required_fields_missing(self):
    """필수 필드 누락 시 유효하지 않다"""
    serializer = AuthResponseSerializer(data={})
    self.assertFalse(serializer.is_valid())
    self.assertIn("access", serializer.errors)


class UserMeSerializerTests(TestCase):

  def setUp(self):
    self.user = User.objects.create_user(
      email="test@example.com",
      password="password123",
      name="홍길동",
    )

  def test_serializes_user_info(self):
    """유저 정보를 직렬화한다"""
    serializer = UserMeSerializer(self.user)
    self.assertEqual(serializer.data["name"], "홍길동")
    self.assertEqual(serializer.data["email"], "test@example.com")
    self.assertFalse(serializer.data["is_email_confirmed"])
    self.assertFalse(serializer.data["is_profile_completed"])
