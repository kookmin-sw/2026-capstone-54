import factory
from factory.django import DjangoModelFactory
from resumes.factories.resume_factory import ResumeFactory
from resumes.models import ResumeCareerMeta


class ResumeCareerMetaFactory(DjangoModelFactory):

  class Meta:
    model = ResumeCareerMeta

  resume = factory.SubFactory(ResumeFactory)
  total_experience_years = None
  total_experience_months = None
