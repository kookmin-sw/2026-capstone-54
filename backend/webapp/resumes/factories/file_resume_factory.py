import factory
from factory.django import DjangoModelFactory
from resumes.models import FileResume
from users.factories import UserFactory


class FileResumeFactory(DjangoModelFactory):

  class Meta:
    model = FileResume

  user = factory.SubFactory(UserFactory)
  title = factory.Sequence(lambda n: f"파일 이력서 {n}")
