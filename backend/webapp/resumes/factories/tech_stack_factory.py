import factory
from factory.django import DjangoModelFactory
from resumes.models import TechStack


class TechStackFactory(DjangoModelFactory):

  class Meta:
    model = TechStack
    django_get_or_create = ("name", )

  name = factory.Sequence(lambda n: f"tech_{n}")
