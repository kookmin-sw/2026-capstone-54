import factory
from factory.django import DjangoModelFactory
from resumes.models import FileResume, Resume, TextResume
from users.factories import UserFactory


class ResumeFactory(DjangoModelFactory):

  class Meta:
    model = Resume

  user = factory.SubFactory(UserFactory)
  resume_type = "text"
  title = factory.Sequence(lambda n: f"이력서 {n}")


class TextResumeFactory(DjangoModelFactory):

  class Meta:
    model = TextResume

  user = factory.SubFactory(UserFactory)
  title = factory.Sequence(lambda n: f"텍스트 이력서 {n}")


class FileResumeFactory(DjangoModelFactory):

  class Meta:
    model = FileResume

  user = factory.SubFactory(UserFactory)
  title = factory.Sequence(lambda n: f"파일 이력서 {n}")
