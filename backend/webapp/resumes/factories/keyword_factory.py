import factory
from factory.django import DjangoModelFactory
from resumes.models import Keyword


class KeywordFactory(DjangoModelFactory):

  class Meta:
    model = Keyword
    django_get_or_create = ("text", )

  text = factory.Sequence(lambda n: f"keyword_{n}")
