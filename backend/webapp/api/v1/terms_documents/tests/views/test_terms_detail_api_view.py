from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from terms_documents.factories import TermsDocumentFactory


class TermsDetailAPIViewTests(TestCase):
  """TermsDetailAPIView 테스트"""

  def setUp(self):
    self.client = APIClient()

  def test_returns_published_terms_detail(self):
    """공개된 약관의 상세 정보를 반환한다."""
    terms = TermsDocumentFactory(is_published=True)
    url = reverse("terms-document-detail", kwargs={"pk": terms.id})

    response = self.client.get(url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data["id"], terms.id)
    self.assertIn("content", response.data)

  def test_returns_404_for_unpublished_terms(self):
    """비공개 약관은 404를 반환한다."""
    terms = TermsDocumentFactory(is_published=False)
    url = reverse("terms-document-detail", kwargs={"pk": terms.id})

    response = self.client.get(url)

    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_returns_404_for_nonexistent_terms(self):
    """존재하지 않는 약관은 404를 반환한다."""
    url = reverse("terms-document-detail", kwargs={"pk": 99999})

    response = self.client.get(url)

    self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

  def test_unauthenticated_request_allowed(self):
    """인증 없이도 약관 상세를 조회할 수 있다."""
    terms = TermsDocumentFactory(is_published=True)
    url = reverse("terms-document-detail", kwargs={"pk": terms.id})

    response = self.client.get(url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
