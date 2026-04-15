import factory
from factory.django import DjangoModelFactory
from resumes.factories.resume_factory import ResumeFactory
from resumes.models import ResumeAward


class ResumeAwardFactory(DjangoModelFactory):

  class Meta:
    model = ResumeAward

  resume = factory.SubFactory(ResumeFactory)
  name = factory.Sequence(lambda n: f"Award {n}")
  year = "2023"
  organization = "주최 기관"
  description = "수상 상세 설명"
  display_order = 0
