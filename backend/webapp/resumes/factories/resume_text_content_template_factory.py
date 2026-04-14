import factory
from factory.django import DjangoModelFactory
from profiles.factories.job_factory import JobFactory
from resumes.models import ResumeTextContentTemplate


class ResumeTextContentTemplateFactory(DjangoModelFactory):

  class Meta:
    model = ResumeTextContentTemplate

  job = factory.SubFactory(JobFactory)
  title = factory.Sequence(lambda n: f"템플릿 {n}")
  content = "## 자기소개\n(내용)"
  display_order = 0
