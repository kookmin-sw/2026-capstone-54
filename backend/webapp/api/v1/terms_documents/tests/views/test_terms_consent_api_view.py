from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from terms_documents.factories import TermsDocumentFactory
from terms_documents.models import UserConsent
from users.factories import UserFactory


class TermsConsentAPIViewTests(TestCase):
  """TermsConsentAPIView 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.user = UserFactory()
    token = RefreshToken.for_user(self.user)
    self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

  def test_consent_creates_user_consent_record(self):
    """약관 동의 시 UserConsent 레코드가 생성된다."""
    terms = TermsDocumentFactory(is_published=True)
    url = reverse("terms-document-consents")

    response = self.client.post(url, data={"terms_document_ids": [terms.id]}, format="json")

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(len(response.data), 1)
    self.assertTrue(UserConsent.objects.filter(user=self.user, terms_document=terms).exists())

  def test_consent_is_idempotent(self):
    """동일 약관에 중복 동의 시 레코드가 갱신된다."""
    terms = TermsDocumentFactory(is_published=True)
    url = reverse("terms-document-consents")

    self.client.post(url, data={"terms_document_ids": [terms.id]}, format="json")
    self.client.post(url, data={"terms_document_ids": [terms.id]}, format="json")

    self.assertEqual(UserConsent.objects.filter(user=self.user, terms_document=terms).count(), 1)

  def test_consent_to_unpublished_terms_returns_404(self):
    """비공개 약관에 동의 시 404를 반환한다."""
    terms = TermsDocumentFactory(is_published=False)
    url = reverse("terms-document-consents")

    response = self.client.post(url, data={"terms_document_ids": [terms.id]}, format="json")

    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_returns_401(self):
    """인증되지 않은 요청은 401을 반환한다."""
    self.client.credentials()
    terms = TermsDocumentFactory(is_published=True)
    url = reverse("terms-document-consents")

    response = self.client.post(url, data={"terms_document_ids": [terms.id]}, format="json")

    self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
