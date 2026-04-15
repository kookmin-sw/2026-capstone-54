import factory
from factory.django import DjangoModelFactory
from job_descriptions.models import JobDescription


class JobDescriptionFactory(DjangoModelFactory):

  class Meta:
    model = JobDescription

  url = factory.Sequence(lambda n: f"https://example.com/jobs/{n}")
  platform = "jobkorea"
  company = "테스트 회사"
  title = "백엔드 개발자"
