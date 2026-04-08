import factory
from factory.django import DjangoModelFactory
from resumes.models import TextResume
from users.factories import UserFactory


class TextResumeFactory(DjangoModelFactory):

  class Meta:
    model = TextResume

  user = factory.SubFactory(UserFactory)
  title = factory.Sequence(lambda n: f"텍스트 이력서 {n}")
