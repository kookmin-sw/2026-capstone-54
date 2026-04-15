import factory
from factory.django import DjangoModelFactory
from resumes.factories.resume_factory import ResumeFactory
from resumes.models import ResumeLanguageSpoken


class ResumeLanguageSpokenFactory(DjangoModelFactory):

  class Meta:
    model = ResumeLanguageSpoken

  resume = factory.SubFactory(ResumeFactory)
  language = "English"
  level = "Business"
  display_order = 0
