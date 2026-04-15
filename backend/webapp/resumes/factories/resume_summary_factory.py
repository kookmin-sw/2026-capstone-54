import factory
from factory.django import DjangoModelFactory
from resumes.factories.resume_factory import ResumeFactory
from resumes.models import ResumeSummary


class ResumeSummaryFactory(DjangoModelFactory):

  class Meta:
    model = ResumeSummary

  resume = factory.SubFactory(ResumeFactory)
  text = ""
