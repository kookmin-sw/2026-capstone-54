"""ResumeProject 생성 또는 수정 서비스.

tech_stack 문자열 배열을 받아 TechStack 공용 참조 테이블에 upsert 한 뒤
ResumeProjectTechStack 경유 테이블을 재생성한다.
"""

from common.services import BaseService
from django.db import transaction
from resumes.models import ResumeProject, ResumeProjectTechStack, TechStack
from resumes.services.mixins import MarkResumeDirtyMixin


class UpsertResumeProjectService(MarkResumeDirtyMixin, BaseService):

  required_value_kwargs = ["resume"]

  def execute(self):
    resume = self.kwargs["resume"]
    uuid = self.kwargs.get("uuid")

    defaults = {
      "name": self.kwargs.get("name") or "",
      "role": self.kwargs.get("role") or "",
      "period": self.kwargs.get("period") or "",
      "description": self.kwargs.get("description") or "",
      "display_order": self.kwargs.get("display_order", 0),
    }

    with transaction.atomic():
      if uuid:
        instance = self.get_or_404(
          ResumeProject,
          message="프로젝트 항목을 찾을 수 없습니다.",
          pk=uuid,
          resume=resume,
        )
        for k, v in defaults.items():
          setattr(instance, k, v)
        instance.save()
      else:
        instance = ResumeProject.objects.create(resume=resume, **defaults)

      # tech_stack 재구성
      tech_names: list[str] = list(self.kwargs.get("tech_stack") or [])
      ResumeProjectTechStack.objects.filter(resume_project=instance).delete()
      for idx, name in enumerate(tech_names):
        tech = TechStack.get_or_create_normalized(name)
        if tech is None:
          continue
        ResumeProjectTechStack.objects.get_or_create(
          resume_project=instance,
          tech_stack=tech,
          defaults={"display_order": idx},
        )

    self._mark_dirty()
    return instance
