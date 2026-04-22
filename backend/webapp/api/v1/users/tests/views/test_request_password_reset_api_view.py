from unittest.mock import patch

from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from users.factories import UserFactory
from users.models import PasswordResetToken


@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class RequestPasswordResetAPIViewTests(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.url = reverse("password-reset")
    self.user = UserFactory(email="viewreset@example.com")

  # ─── 정상 케이스 ───

  @patch("users.tasks.send_password_reset_email_task.SendPasswordResetEmailTask.run")
  def test_valid_email_returns_200(self, mock_task):
    """존재하는 이메일로 요청 시 200 응답과 안내 메시지를 반환한다"""
    data = {"email": self.user.email}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["message"], "이메일을 확인해주세요.")

  @patch("users.tasks.send_password_reset_email_task.SendPasswordResetEmailTask.run")
  def test_creates_token_in_database(self, mock_task):
    """요청 후 DB에 PasswordResetToken이 생성된다"""
    data = {"email": self.user.email}
    self.client.post(self.url, data, format="json")

    self.assertTrue(PasswordResetToken.objects.filter(user=self.user).exists())

  def test_no_authentication_required(self):
    """인증 없이 요청할 수 있다 (AllowAny)"""
    data = {"email": "nonexistent@example.com"}
    response = self.client.post(self.url, data, format="json")

    # AllowAny이므로 401이 아닌 다른 응답이 와야 한다
    self.assertNotEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

  # ─── 반례 ───

  def test_nonexistent_email_returns_404(self):
    """존재하지 않는 이메일로 요청 시 404를 반환한다"""
    data = {"email": "nobody@example.com"}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_missing_email_returns_400(self):
    """email 없이 요청 시 400을 반환한다"""
    data = {}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_invalid_email_format_returns_400(self):
    """잘못된 이메일 형식으로 요청 시 400을 반환한다"""
    data = {"email": "not-an-email"}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_empty_email_returns_400(self):
    """빈 문자열 이메일로 요청 시 400을 반환한다"""
    data = {"email": ""}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
