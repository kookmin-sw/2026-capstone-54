from django.test import override_settings
from django.urls import reverse
from hypothesis import given, settings
from hypothesis import strategies as st
from hypothesis.extra.django import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.factories import UserFactory
from users.models import User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class UnregisterAPIViewPropertyTests(TestCase):
  """UnregisterAPIView property 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.url = reverse("unregister")

  @given(name=st.text(min_size=1, max_size=50, alphabet=st.characters(whitelist_categories=("Lu", "Ll", "Nd", "Lo"))), )
  @settings(max_examples=5, deadline=None)
  def test_unregister_soft_deletes_and_masks_personal_info(self, name):
    """인증된 User가 탈퇴를 요청하면 204 응답이 반환되고 User가 소프트 삭제(deleted_at 설정)되며 개인정보가 마스킹 처리된다."""
    email = "unregister_test@example.com"
    User.objects.filter(email=email).delete()
    if hasattr(User, "all_objects"):
      User.all_objects.filter(email=email).delete()

    user = UserFactory(email=email, name=name)
    user_pk = user.pk

    token = RefreshToken.for_user(user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")

    response = self.client.delete(self.url)

    self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    # 일반 objects에서는 조회되지 않아야 한다 (소프트 삭제)
    self.assertFalse(User.objects.filter(pk=user_pk).exists())

    # all_objects에서는 조회되어야 한다
    self.assertTrue(User.all_objects.filter(pk=user_pk).exists())

    deleted_user = User.all_objects.get(pk=user_pk)

    # deleted_at이 설정되어야 한다
    self.assertIsNotNone(deleted_user.deleted_at)

    # 개인정보가 마스킹되어야 한다
    self.assertEqual(deleted_user.name, f"deleted_user+{user_pk}")
    self.assertFalse(deleted_user.has_usable_password())

  def test_unauthenticated_user_cannot_unregister(self):
    """비인증 사용자는 탈퇴할 수 없다"""
    response = self.client.delete(self.url)
    self.assertIn(
      response.status_code,
      [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
    )
