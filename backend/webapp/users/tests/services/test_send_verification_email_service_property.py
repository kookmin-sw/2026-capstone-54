from datetime import timedelta

from django.test import override_settings
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from users.factories import UserFactory
from users.models import EmailVerificationCode
from users.services.send_verification_email_service import SendVerificationEmailService


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class SendVerificationEmailServicePropertyTests(TestCase):
  """SendVerificationEmailService OTP 코드 형식 및 만료 시간 불변식 property 테스트"""

  def setUp(self):
    self.user = UserFactory()

  @given(st.just(None))
  @settings(max_examples=1, deadline=None)
  def test_otp_code_format_and_expiry_invariant(self, _):
    """생성된 OTP 코드는 정확히 6자리이고 대문자(A-Z)와 숫자(0-9)로만 구성되며, expires_at은 created_at으로부터 10분 후이다."""

    EmailVerificationCode.objects.all().delete()

    SendVerificationEmailService(user=self.user).perform()

    code_obj = EmailVerificationCode.objects.filter(user=self.user).order_by("-created_at").first()

    # 1. 코드는 정확히 6자리여야 한다
    self.assertEqual(len(code_obj.code), 6)

    # 2. 코드는 대문자(A-Z)와 숫자(0-9)로만 구성되어야 한다
    allowed_chars = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
    for ch in code_obj.code:
      self.assertIn(ch, allowed_chars)

    # 3. expires_at은 created_at으로부터 정확히 10분 후여야 한다 (1초 허용 오차)
    expected_expiry = code_obj.created_at + timedelta(minutes=10)
    delta = abs((code_obj.expires_at - expected_expiry).total_seconds())
    self.assertLessEqual(delta, 1.0)
