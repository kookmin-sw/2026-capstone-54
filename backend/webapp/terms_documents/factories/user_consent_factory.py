import factory
from django.utils import timezone
from factory.django import DjangoModelFactory
from terms_documents.factories.terms_document_factory import TermsDocumentFactory
from terms_documents.models import UserConsent


class UserConsentFactory(DjangoModelFactory):

  class Meta:
    model = UserConsent

  user = factory.SubFactory("users.factories.UserFactory")
  terms_document = factory.SubFactory(TermsDocumentFactory)
  agreed_at = factory.LazyFunction(timezone.now)
