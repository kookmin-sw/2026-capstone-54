from django.test import override_settings
from django.urls import reverse
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from users.factories import DEFAULT_PASSWORD, UserFactory
from users.models import User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class SignInAPIViewPropertyTests(TestCase):
  """SignInAPIView property 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.url = reverse("sign-in")

  @given(
    name=st.text(
      min_size=1,
      max_size=20,
      alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Lo")),
    ),
  )
  @settings(max_examples=5, deadline=None)
  def test_sign_in_with_valid_credentials_returns_full_response(self, name):
    """등록된 User의 올바른 email과 password로 로그인하면 access/refresh/is_email_confirmed/is_profile_completed 포함된 200 응답이 반환된다."""
    email = "signin_valid_test@example.com"

    User.objects.filter(email=email).delete()
    UserFactory(email=email, name=name)

    data = {"email": email, "password": DEFAULT_PASSWORD}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertIn("access", response.data)
    self.assertIn("is_email_confirmed", response.data)
    self.assertIn("is_profile_completed", response.data)
    self.assertIn("mefit_refresh", response.cookies)

  @given(
    wrong_email=st.emails(),
    wrong_password=st.text(
      min_size=1,
      max_size=30,
      alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Po", "Pd")),
    ),
  )
  @settings(max_examples=5, deadline=None)
  def test_sign_in_with_wrong_credentials_returns_401(self, wrong_email, wrong_password):
    """존재하지 않는 이메일 또는 잘못된 비밀번호로 로그인을 시도하면 401 에러가 반환된다."""
    from django.core.exceptions import ValidationError
    from django.core.validators import validate_email
    from hypothesis import assume

    real_email = "signin_real_user@example.com"

    User.objects.filter(email=real_email).delete()
    UserFactory(email=real_email, name="실제유저")

    # Django EmailField가 유효하다고 판단하는 이메일만 테스트
    try:
      validate_email(wrong_email)
    except ValidationError:
      assume(False)

    # 존재하지 않는 이메일이거나 잘못된 비밀번호여야 한다
    from django.contrib.auth.models import BaseUserManager

    assume(BaseUserManager.normalize_email(wrong_email) != real_email or wrong_password != DEFAULT_PASSWORD)

    data = {"email": wrong_email, "password": wrong_password}
    response = self.client.post(self.url, data, format="json")

    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
