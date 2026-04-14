import factory
from factory.django import DjangoModelFactory
from resumes.models import IndustryDomain


class IndustryDomainFactory(DjangoModelFactory):

  class Meta:
    model = IndustryDomain
    django_get_or_create = ("name", )

  name = factory.Sequence(lambda n: f"domain_{n}")
