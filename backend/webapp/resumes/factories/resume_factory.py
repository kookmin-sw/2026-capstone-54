import factory
from factory.django import DjangoModelFactory
from resumes.models import Resume
from users.factories import UserFactory


class ResumeFactory(DjangoModelFactory):

  class Meta:
    model = Resume

  user = factory.SubFactory(UserFactory)
  type = "text"
  title = factory.Sequence(lambda n: f"이력서 {n}")
