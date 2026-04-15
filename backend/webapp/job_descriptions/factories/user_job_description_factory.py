import factory
from factory.django import DjangoModelFactory
from job_descriptions.models import JobDescription, UserJobDescription


class JobDescriptionFactory(DjangoModelFactory):

  class Meta:
    model = JobDescription

  url = factory.Sequence(lambda n: f"https://example.com/jobs/{n}")
  title = factory.Sequence(lambda n: f"채용공고 {n}")
  company = factory.Sequence(lambda n: f"회사 {n}")


class UserJobDescriptionFactory(DjangoModelFactory):

  class Meta:
    model = UserJobDescription

  user = factory.SubFactory("users.factories.UserFactory")
  job_description = factory.SubFactory(JobDescriptionFactory)
