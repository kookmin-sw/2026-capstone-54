import factory
from factory.django import DjangoModelFactory
from resumes.models import ResumeTextContent
from users.factories import UserFactory

from .text_resume_factory import TextResumeFactory


class ResumeTextContentFactory(DjangoModelFactory):

  class Meta:
    model = ResumeTextContent

  user = factory.SubFactory(UserFactory)
  resume = factory.SubFactory(TextResumeFactory, user=factory.SelfAttribute("..user"))
  content = "Python 백엔드 개발자입니다. Django, FastAPI 경험이 있습니다."
