from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import NotFound

from terms_documents.enums import TermsType
from terms_documents.factories import TermsDocumentFactory
from terms_documents.models import UserConsent
from terms_documents.services import AgreeToTermsDocumentService
from users.factories import UserFactory


class AgreeToTermsDocumentServiceTests(TestCase):
  """약관 동의 서비스의 생성/갱신/예외 동작을 검증한다."""

  def setUp(self):
    self.user = UserFactory()
    self.terms_document = TermsDocumentFactory(
      terms_type=TermsType.TERMS_OF_SERVICE,
      is_published=True,
    )

  def test_creates_consent_record_for_published_document(self):
    """공개된 약관 ID를 전달하면 사용자 동의 이력이 새로 생성되는지 확인한다."""
    AgreeToTermsDocumentService(user=self.user, terms_document_ids=[self.terms_document.id]).perform()
    self.assertTrue(
      UserConsent.objects.filter(user=self.user, terms_document=self.terms_document).exists()
    )

  def test_returns_created_consent_list(self):
    """서비스 실행 결과가 생성/갱신된 UserConsent 객체 리스트 형태로 반환되는지 검증한다."""
    consents = AgreeToTermsDocumentService(user=self.user, terms_document_ids=[self.terms_document.id]).perform()
    self.assertIsInstance(consents, list)
    self.assertEqual(len(consents), 1)
    self.assertEqual(consents[0].user, self.user)
    self.assertEqual(consents[0].terms_document, self.terms_document)

  def test_handles_bulk_consent_for_multiple_documents(self):
    """여러 약관 ID를 한 번에 전달했을 때 모두 동의 처리되고 결과도 모두 반환되는지 확인한다."""
    other_terms_document = TermsDocumentFactory(
      terms_type=TermsType.PRIVACY_POLICY,
      is_published=True,
    )
    consents = AgreeToTermsDocumentService(
      user=self.user,
      terms_document_ids=[self.terms_document.id, other_terms_document.id],
    ).perform()
    self.assertEqual(len(consents), 2)
    self.assertEqual(UserConsent.objects.filter(user=self.user).count(), 2)

  def test_sets_agreed_at_to_current_time_window(self):
    """동의 처리 시 agreed_at이 실행 시점 범위 내의 현재 시각으로 저장되는지 검증한다."""
    before = timezone.now()
    consents = AgreeToTermsDocumentService(user=self.user, terms_document_ids=[self.terms_document.id]).perform()
    after = timezone.now()
    self.assertGreaterEqual(consents[0].agreed_at, before)
    self.assertLessEqual(consents[0].agreed_at, after)

  def test_updates_agreed_at_on_reconsent_without_creating_duplicate(self):
    """같은 약관에 재동의하면 레코드는 유지되고 agreed_at만 최신 시각으로 갱신되는지 확인한다."""
    first = AgreeToTermsDocumentService(user=self.user, terms_document_ids=[self.terms_document.id]).perform()
    second = AgreeToTermsDocumentService(user=self.user, terms_document_ids=[self.terms_document.id]).perform()

    self.assertEqual(
      UserConsent.objects.filter(user=self.user, terms_document=self.terms_document).count(), 1
    )
    self.assertGreaterEqual(second[0].agreed_at, first[0].agreed_at)

  def test_raises_not_found_for_unpublished_document(self):
    """비공개 약관 ID로 동의를 시도하면 NotFound 예외가 발생하는지 검증한다."""
    unpublished = TermsDocumentFactory(
      terms_type=TermsType.PRIVACY_POLICY,
      is_published=False,
    )
    with self.assertRaises(NotFound):
      AgreeToTermsDocumentService(user=self.user, terms_document_ids=[unpublished.id]).perform()

  def test_raises_not_found_for_nonexistent_document_id(self):
    """존재하지 않는 약관 ID를 전달하면 NotFound 예외가 발생하는지 확인한다."""
    with self.assertRaises(NotFound):
      AgreeToTermsDocumentService(user=self.user, terms_document_ids=[99999]).perform()

  def test_manages_consents_independently_per_user(self):
    """동일 약관이라도 사용자별 동의 이력이 서로 독립적으로 관리되는지 검증한다."""
    other_user = UserFactory()
    AgreeToTermsDocumentService(user=self.user, terms_document_ids=[self.terms_document.id]).perform()
    AgreeToTermsDocumentService(user=other_user, terms_document_ids=[self.terms_document.id]).perform()

    self.assertEqual(UserConsent.objects.filter(terms_document=self.terms_document).count(), 2)
    self.assertTrue(UserConsent.objects.filter(user=self.user, terms_document=self.terms_document).exists())
    self.assertTrue(UserConsent.objects.filter(user=other_user, terms_document=self.terms_document).exists())
