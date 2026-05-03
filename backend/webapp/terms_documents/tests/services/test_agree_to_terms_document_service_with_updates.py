from django.test import TestCase
from django.utils import timezone
from terms_documents.enums import TermsType
from terms_documents.factories import TermsDocumentFactory
from terms_documents.models import UserConsent
from terms_documents.services import AgreeToTermsDocumentService
from users.factories import UserFactory


class AgreeToTermsDocumentServiceWithUpdatesTests(TestCase):

  def setUp(self):
    self.user = UserFactory()
    self.terms_document = TermsDocumentFactory(
      terms_type=TermsType.TERMS_OF_SERVICE,
      is_published=True,
    )

  def test_agree_with_updates_creates_consent(self):
    updates = [{"terms_document_id": self.terms_document.id, "is_agreed": True}]
    consents = AgreeToTermsDocumentService(
      user=self.user,
      updates=updates,
    ).perform()

    self.assertEqual(len(consents), 1)
    consent = UserConsent.objects.get(user=self.user, terms_document=self.terms_document)
    self.assertIsNotNone(consent.agreed_at)
    self.assertIsNone(consent.disagreed_at)
    self.assertTrue(consent.is_agreed())

  def test_disagree_with_updates_sets_disagreed_at(self):
    UserConsent.objects.create(
      user=self.user,
      terms_document=self.terms_document,
      agreed_at=timezone.now(),
    )

    updates = [{"terms_document_id": self.terms_document.id, "is_agreed": False}]
    AgreeToTermsDocumentService(
      user=self.user,
      updates=updates,
    ).perform()

    consent = UserConsent.objects.get(user=self.user, terms_document=self.terms_document)
    self.assertIsNone(consent.agreed_at)
    self.assertIsNotNone(consent.disagreed_at)
    self.assertFalse(consent.is_agreed())

  def test_multiple_updates(self):
    terms2 = TermsDocumentFactory(
      terms_type=TermsType.PRIVACY_POLICY,
      is_published=True,
    )

    updates = [
      {
        "terms_document_id": self.terms_document.id,
        "is_agreed": True
      },
      {
        "terms_document_id": terms2.id,
        "is_agreed": False
      },
    ]
    consents = AgreeToTermsDocumentService(
      user=self.user,
      updates=updates,
    ).perform()

    self.assertEqual(len(consents), 2)
