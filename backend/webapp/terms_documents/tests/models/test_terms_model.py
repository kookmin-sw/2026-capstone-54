from unittest.mock import patch

from django.db import IntegrityError
from django.test import TestCase
from terms_documents.enums import TermsType
from terms_documents.factories import TermsDocumentFactory
from terms_documents.models import TermsDocument


class TermsDocumentModelTests(TestCase):
  """TermsDocument 모델의 버전/공개/제약 동작을 검증한다."""

  def setUp(self):
    self.terms = TermsDocumentFactory(terms_type=TermsType.TERMS_OF_SERVICE)

  def test_create_terms_document(self):
    """약관 엔티티를 생성했을 때 기본 필드가 정상 저장되고 PK가 발급되는지 확인한다."""
    self.assertIsNotNone(self.terms.pk)
    self.assertEqual(self.terms.terms_type, TermsType.TERMS_OF_SERVICE)

  def test_assigns_version_one_on_first_create(self):
    """동일한 terms_type에서 첫 생성 문서의 version이 1로 시작하는 규칙을 검증한다."""
    self.assertEqual(self.terms.version, 1)

  def test_assigns_version_two_on_second_document_same_type(self):
    """동일한 terms_type으로 두 번째 문서를 만들면 version이 2로 증가하는지 확인한다."""
    second = TermsDocumentFactory(terms_type=TermsType.TERMS_OF_SERVICE)
    self.assertEqual(second.version, 2)

  def test_version_counter_is_independent_per_terms_type(self):
    """terms_type이 다르면 버전 카운터가 분리되어 각각 1부터 계산되는지 검증한다."""
    privacy = TermsDocumentFactory(terms_type=TermsType.PRIVACY_POLICY)
    self.assertEqual(privacy.version, 1)

  def test_assigns_versions_sequentially_within_same_type(self):
    """동일한 terms_type에서 문서를 연속 생성할 때 version이 1씩 순차 증가하는지 확인한다."""
    v2 = TermsDocumentFactory(terms_type=TermsType.TERMS_OF_SERVICE)
    v3 = TermsDocumentFactory(terms_type=TermsType.TERMS_OF_SERVICE)
    self.assertEqual(v2.version, 2)
    self.assertEqual(v3.version, 3)

  def test_str_representation_includes_type_title_and_version(self):
    """문자열 표현에 사람이 식별할 수 있는 타입명, 제목, 버전 정보가 포함되는지 확인한다."""
    result = str(self.terms)
    self.assertIn("이용약관", result)
    self.assertIn("v1", result)

  def test_is_published_defaults_to_false(self):
    """published_at이 비어 있는 새 약관은 공개 상태로 간주되지 않는지 검증한다."""
    self.assertFalse(self.terms.is_published)

  def test_is_required_defaults_to_true(self):
    """명시하지 않으면 약관이 기본적으로 필수 동의 대상으로 생성되는지 확인한다."""
    self.assertTrue(self.terms.is_required)

  def test_rejects_multiple_published_documents_for_same_type(self):
    """같은 terms_type에 공개 문서를 두 개 이상 만들면 DB 제약으로 실패하는지 검증한다."""
    TermsDocumentFactory(terms_type=TermsType.TERMS_OF_SERVICE, is_published=True)
    with self.assertRaises(IntegrityError):
      TermsDocumentFactory(terms_type=TermsType.TERMS_OF_SERVICE, is_published=True)

  def test_allows_published_document_per_each_different_type(self):
    """서로 다른 terms_type은 각자 하나씩 공개 문서를 가질 수 있는지 확인한다."""
    TermsDocumentFactory(terms_type=TermsType.TERMS_OF_SERVICE, is_published=True)
    TermsDocumentFactory(terms_type=TermsType.PRIVACY_POLICY, is_published=True)
    TermsDocumentFactory(terms_type=TermsType.MARKETING, is_published=True)
    self.assertEqual(TermsDocument.objects.published().count(), 3)

  def test_marketing_terms_type_exists(self):
    marketing = TermsDocumentFactory(terms_type=TermsType.MARKETING, is_published=True)
    self.assertEqual(marketing.terms_type, TermsType.MARKETING)
    self.assertIn("마케팅", str(marketing))

  def test_published_queryset_returns_only_published_documents(self):
    """published() 쿼리셋이 공개된 문서만 반환하고 비공개 문서는 제외하는지 검증한다."""
    TermsDocumentFactory(terms_type=TermsType.TERMS_OF_SERVICE, is_published=True)
    TermsDocumentFactory(terms_type=TermsType.PRIVACY_POLICY, is_published=False)
    published = TermsDocument.objects.published()
    self.assertEqual(published.count(), 1)

  def test_updating_existing_document_does_not_change_version(self):
    """이미 생성된 약관을 수정 저장해도 기존 version 값이 유지되는지 확인한다."""
    original_version = self.terms.version
    self.terms.title = "수정된 제목"
    self.terms.save()
    self.terms.refresh_from_db()
    self.assertEqual(self.terms.version, original_version)

  def test_retries_version_assignment_on_integrity_error(self):
    """신규 저장 중 무결성 충돌이 발생하면 재시도로 저장을 회복하는지 검증한다."""
    terms = TermsDocument(
      terms_type=TermsType.TERMS_OF_SERVICE,
      title="동시성 테스트 약관",
      content="내용",
    )

    with patch("django.db.models.Model.save", side_effect=[IntegrityError("dup"), None]) as mocked_save:
      terms.save()

    self.assertEqual(mocked_save.call_count, 2)

  def test_raises_integrity_error_after_retry_exhaustion(self):
    """무결성 충돌이 계속되면 최대 재시도 후 명시적 IntegrityError를 발생시키는지 확인한다."""
    terms = TermsDocument(
      terms_type=TermsType.TERMS_OF_SERVICE,
      title="동시성 실패 테스트 약관",
      content="내용",
    )

    with patch("django.db.models.Model.save", side_effect=IntegrityError("dup")) as mocked_save:
      with self.assertRaisesMessage(IntegrityError, "약관 버전 할당 중"):
        terms.save()

    self.assertEqual(mocked_save.call_count, terms.VERSION_ASSIGN_MAX_RETRIES)
