import factory
from factory.django import DjangoModelFactory
from resumes.factories.resume_factory import ResumeFactory
from resumes.factories.skill_factory import SkillFactory
from resumes.models import ResumeSkill


class ResumeSkillFactory(DjangoModelFactory):

  class Meta:
    model = ResumeSkill

  resume = factory.SubFactory(ResumeFactory)
  skill = factory.SubFactory(SkillFactory)
  display_order = 0
