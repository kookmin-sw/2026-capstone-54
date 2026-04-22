import uuid
from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from users.factories import DEFAULT_PASSWORD, PasswordResetTokenFactory, UserFactory


class ConfirmPasswordResetAPIViewTests(TestCase):

  def setUp(self):
    self.client = APIClient()
    self.url = reverse("password-reset-confirm")
    self.user = UserFactory(email="confirm-reset@example.com")
    self.token = PasswordResetTokenFactory(user=self.user)
    self.new_password = "NewSecurePass123!"

  # ─── 정상 케이스 ───

  def test_successful_password_reset_returns_200(self):
    """유효한 토큰과 새 비밀번호로 요청 시 200 응답과 성공 메시지를 반환한다"""
    data = {"token": str(self.token.token), "newPassword": self.new_password}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["message"], "비밀번호가 변경되었습니다.")

  def test_password_actually_changed_after_reset(self):
    """비밀번호 재설정 후 실제로 비밀번호가 변경된다"""
    data = {"token": str(self.token.token), "newPassword": self.new_password}
    self.client.post(self.url, data, format="json")

    self.user.refresh_from_db()
    self.assertTrue(self.user.check_password(self.new_password))
    self.assertFalse(self.user.check_password(DEFAULT_PASSWORD))

  def test_no_authentication_required(self):
    """인증 없이 요청할 수 있다 (AllowAny)"""
    data = {"token": str(self.token.token), "newPassword": self.new_password}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)

  # ─── 토큰 관련 반례 ───

  def test_nonexistent_token_returns_404(self):
    """존재하지 않는 토큰으로 요청 시 404를 반환한다"""
    data = {"token": str(uuid.uuid4()), "newPassword": self.new_password}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_already_used_token_returns_400(self):
    """이미 사용된 토큰으로 요청 시 400을 반환한다"""
    self.token.used_at = timezone.now()
    self.token.save(update_fields=["used_at"])

    data = {"token": str(self.token.token), "newPassword": self.new_password}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_expired_token_returns_400(self):
    """만료된 토큰으로 요청 시 400을 반환한다"""
    self.token.expires_at = timezone.now() - timedelta(minutes=1)
    self.token.save(update_fields=["expires_at"])

    data = {"token": str(self.token.token), "newPassword": self.new_password}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  # ─── 비밀번호 유효성 반례 ───

  def test_short_password_returns_400(self):
    """8자 미만 비밀번호로 요청 시 400을 반환한다"""
    data = {"token": str(self.token.token), "newPassword": "Short1!"}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_numeric_only_password_returns_400(self):
    """숫자로만 구성된 비밀번호로 요청 시 400을 반환한다"""
    data = {"token": str(self.token.token), "newPassword": "12345678"}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  # ─── 필수값 누락 반례 ───

  def test_missing_token_returns_400(self):
    """token 없이 요청 시 400을 반환한다"""
    data = {"newPassword": self.new_password}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_missing_password_returns_400(self):
    """newPassword 없이 요청 시 400을 반환한다"""
    data = {"token": str(self.token.token)}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  def test_invalid_uuid_format_returns_400(self):
    """잘못된 UUID 형식으로 요청 시 400을 반환한다"""
    data = {"token": "not-a-valid-uuid", "newPassword": self.new_password}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

  # ─── 재사용 방지 ───

  def test_reusing_token_after_success_returns_400(self):
    """비밀번호 변경 성공 후 같은 토큰으로 재요청 시 400을 반환한다"""
    data = {"token": str(self.token.token), "newPassword": self.new_password}
    self.client.post(self.url, data, format="json")

    data["newPassword"] = "AnotherPass456!"
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
