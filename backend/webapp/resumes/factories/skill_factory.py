import factory
from factory.django import DjangoModelFactory
from resumes.enums import SkillType
from resumes.models import Skill


class SkillFactory(DjangoModelFactory):

  class Meta:
    model = Skill
    django_get_or_create = ("name", "skill_type")

  name = factory.Sequence(lambda n: f"skill_{n}")
  skill_type = SkillType.TECHNICAL
