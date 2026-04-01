from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from terms_documents.enums import TermsType
from terms_documents.factories import TermsDocumentFactory


class TermsListAPIViewTests(TestCase):
  """TermsListAPIView 테스트"""

  def setUp(self):
    self.client = APIClient()
    self.url = reverse("terms-document-list")

  def test_returns_only_published_terms(self):
    """공개된 약관만 반환한다."""
    published = TermsDocumentFactory(is_published=True, terms_type=TermsType.TERMS_OF_SERVICE)
    TermsDocumentFactory(is_published=False, terms_type=TermsType.PRIVACY_POLICY)

    response = self.client.get(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    ids = [item["id"] for item in response.data]
    self.assertIn(published.id, ids)
    self.assertEqual(len(ids), 1)

  def test_returns_empty_list_when_no_published_terms(self):
    """공개된 약관이 없으면 빈 목록을 반환한다."""
    TermsDocumentFactory(is_published=False)

    response = self.client.get(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertEqual(response.data, [])

  def test_unauthenticated_request_allowed(self):
    """인증 없이도 약관 목록을 조회할 수 있다."""
    TermsDocumentFactory(is_published=True)

    response = self.client.get(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)

  def test_response_excludes_content_field(self):
    """목록 응답에는 content(본문)가 포함되지 않는다."""
    TermsDocumentFactory(is_published=True)

    response = self.client.get(self.url)

    self.assertEqual(response.status_code, status.HTTP_200_OK)
    self.assertNotIn("content", response.data[0])
