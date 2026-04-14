import factory
from factory.django import DjangoModelFactory
from resumes.factories.resume_factory import ResumeFactory
from resumes.models import ResumeEducation


class ResumeEducationFactory(DjangoModelFactory):

  class Meta:
    model = ResumeEducation

  resume = factory.SubFactory(ResumeFactory)
  school = factory.Sequence(lambda n: f"School {n}")
  degree = "학사"
  major = "컴퓨터공학"
  period = "2016-2020"
  display_order = 0
