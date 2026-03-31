from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from terms_documents.enums import TermsType
from terms_documents.factories import TermsDocumentFactory, UserConsentFactory
from users.factories import UserFactory


class MyConsentsAPIViewTests(TestCase):
  """MyConsentsAPIView 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory()
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    self.url = reverse("my-consents")

  def test_returns_my_consents_only(self):
    """본인의 약관 동의 목록만 반환한다."""
    other_user = UserFactory()
    my_terms = TermsDocumentFactory(is_published=True, terms_type=TermsType.TERMS_OF_SERVICE)
    other_terms = TermsDocumentFactory(is_published=True, terms_type=TermsType.PRIVACY_POLICY)

    UserConsentFactory(user=self.user, terms_document=my_terms)
    UserConsentFactory(user=other_user, terms_document=other_terms)

    response = self.client.get(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 1)
    self.assertEqual(response.data[0]["terms_document"]["id"], my_terms.id)

  def test_returns_empty_list_when_no_consents(self):
    """동의 이력이 없으면 빈 목록을 반환한다."""
    response = self.client.get(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data, [])

  def test_unauthenticated_request_returns_401(self):
    """인증되지 않은 요청은 401을 반환한다."""
    self.client.credentials()

    response = self.client.get(self.url)

    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
