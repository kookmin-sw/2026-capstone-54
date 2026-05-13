import factory
from factory.django import DjangoModelFactory
from resumes.factories.resume_factory import ResumeFactory
from resumes.models import ResumeBasicInfo


class ResumeBasicInfoFactory(DjangoModelFactory):

  class Meta:
    model = ResumeBasicInfo

  resume = factory.SubFactory(ResumeFactory)
  name = ""
  email = ""
  phone = ""
  location = ""
