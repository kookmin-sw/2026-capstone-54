from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone

from terms_documents.enums import TermsType
from terms_documents.factories import TermsDocumentFactory, UserConsentFactory
from terms_documents.models import UserConsent
from users.factories import UserFactory


class UserConsentModelTests(TestCase):
  """UserConsent 모델의 제약조건과 연관 삭제 동작을 검증한다."""

  def setUp(self):
    self.user = UserFactory()
    self.terms = TermsDocumentFactory(
      terms_type=TermsType.TERMS_OF_SERVICE,
      is_published=True,
    )

  def test_create_user_consent(self):
    """사용자와 약관을 연결한 동의 이력이 정상 생성되고 FK가 올바르게 연결되는지 확인한다."""
    consent = UserConsentFactory(user=self.user, terms_document=self.terms)
    self.assertIsNotNone(consent.pk)
    self.assertEqual(consent.user, self.user)
    self.assertEqual(consent.terms_document, self.terms)

  def test_persists_agreed_at_timestamp(self):
    """동의 시각을 명시했을 때 agreed_at 필드가 손실 없이 저장되는지 검증한다."""
    now = timezone.now()
    consent = UserConsentFactory(user=self.user, terms_document=self.terms, agreed_at=now)
    consent.refresh_from_db()
    self.assertIsNotNone(consent.agreed_at)

  def test_prevents_duplicate_consent_for_same_user_and_document(self):
    """동일한 사용자-약관 조합은 유니크 제약으로 중복 생성이 차단되는지 확인한다."""
    UserConsentFactory(user=self.user, terms_document=self.terms)
    with self.assertRaises(IntegrityError):
      UserConsentFactory(user=self.user, terms_document=self.terms)

  def test_allows_different_users_to_consent_to_same_document(self):
    """같은 약관이라도 사용자가 다르면 각각 독립적인 동의 이력을 가질 수 있는지 검증한다."""
    other_user = UserFactory()
    UserConsentFactory(user=self.user, terms_document=self.terms)
    UserConsentFactory(user=other_user, terms_document=self.terms)
    self.assertEqual(UserConsent.objects.filter(terms_document=self.terms).count(), 2)

  def test_allows_same_user_to_consent_to_different_documents(self):
    """한 사용자가 여러 약관에 각각 동의할 수 있고 레코드가 분리 저장되는지 확인한다."""
    other_terms = TermsDocumentFactory(terms_type=TermsType.PRIVACY_POLICY)
    UserConsentFactory(user=self.user, terms_document=self.terms)
    UserConsentFactory(user=self.user, terms_document=other_terms)
    self.assertEqual(UserConsent.objects.filter(user=self.user).count(), 2)

  def test_str_representation_includes_user_and_document(self):
    """문자열 표현에 사용자와 약관 식별 정보가 포함되어 관리자 화면에서 구분 가능한지 확인한다."""
    consent = UserConsentFactory(user=self.user, terms_document=self.terms)
    result = str(consent)
    self.assertIn(str(self.user), result)
    self.assertIn(str(self.terms), result)

  def test_prevents_deleting_document_when_consents_exist(self):
    """동의 이력이 연결된 약관은 PROTECT 제약으로 삭제되지 않는지 검증한다."""
    from django.db.models import ProtectedError
    UserConsentFactory(user=self.user, terms_document=self.terms)
    with self.assertRaises(ProtectedError):
      self.terms.delete()

  def test_keeps_consents_when_user_is_soft_deleted(self):
    """사용자 소프트 삭제 시 사용자 row가 남아 동의 이력도 유지되는지 확인한다."""
    UserConsentFactory(user=self.user, terms_document=self.terms)
    self.user.delete()
    self.assertEqual(UserConsent.objects.filter(terms_document=self.terms).count(), 1)

  def test_deletes_consents_when_user_is_hard_deleted(self):
    """사용자 하드 삭제 시 연결된 동의 이력이 CASCADE로 함께 삭제되는지 검증한다."""
    UserConsentFactory(user=self.user, terms_document=self.terms)
    self.user.hard_delete()
    self.assertEqual(UserConsent.objects.filter(terms_document=self.terms).count(), 0)
