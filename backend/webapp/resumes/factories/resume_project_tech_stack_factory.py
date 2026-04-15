import factory
from factory.django import DjangoModelFactory
from resumes.factories.resume_project_factory import ResumeProjectFactory
from resumes.factories.tech_stack_factory import TechStackFactory
from resumes.models import ResumeProjectTechStack


class ResumeProjectTechStackFactory(DjangoModelFactory):

  class Meta:
    model = ResumeProjectTechStack

  resume_project = factory.SubFactory(ResumeProjectFactory)
  tech_stack = factory.SubFactory(TechStackFactory)
  display_order = 0
