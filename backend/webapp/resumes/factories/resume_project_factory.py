import factory
from factory.django import DjangoModelFactory
from resumes.factories.resume_factory import ResumeFactory
from resumes.models import ResumeProject


class ResumeProjectFactory(DjangoModelFactory):

  class Meta:
    model = ResumeProject

  resume = factory.SubFactory(ResumeFactory)
  name = factory.Sequence(lambda n: f"Project {n}")
  role = "Lead"
  period = "2023"
  description = ""
  display_order = 0
