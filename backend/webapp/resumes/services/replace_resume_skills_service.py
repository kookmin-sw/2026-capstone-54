"""이력서 스킬 (N:M) 전체 교체 서비스.

payload 는 4그룹 dict: {technical:[], soft:[], tools:[], languages:[]}
기존 ResumeSkill 을 전부 지우고 새로 생성한다. Skill 공용 참조 테이블은 get_or_create.
"""

from common.services import BaseService
from django.db import transaction
from resumes.enums import SkillType
from resumes.models import ResumeSkill, Skill
from resumes.services.mixins import MarkResumeDirtyMixin


class ReplaceResumeSkillsService(MarkResumeDirtyMixin, BaseService):

  required_value_kwargs = ["resume"]

  def execute(self):
    resume = self.kwargs["resume"]
    groups = self.kwargs.get("skills") or {}

    with transaction.atomic():
      ResumeSkill.objects.filter(resume=resume).delete()
      order = 0
      for group_key, skill_type in (
        ("technical", SkillType.TECHNICAL),
        ("soft", SkillType.SOFT),
        ("tools", SkillType.TOOL),
        ("languages", SkillType.LANGUAGE),
      ):
        for name in groups.get(group_key) or []:
          skill = Skill.get_or_create_normalized(name, skill_type)
          if skill is None:
            continue
          ResumeSkill.objects.get_or_create(
            resume=resume,
            skill=skill,
            defaults={"display_order": order},
          )
          order += 1

    self._mark_dirty()
    return resume
