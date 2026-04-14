"""ResumeEducation 생성 또는 수정 서비스."""

from common.services import BaseService
from resumes.models import ResumeEducation
from resumes.services.mixins import MarkResumeDirtyMixin


class UpsertResumeEducationService(MarkResumeDirtyMixin, BaseService):

  required_value_kwargs = ["resume"]

  def execute(self):
    resume = self.kwargs["resume"]
    uuid = self.kwargs.get("uuid")

    defaults = {
      "school": self.kwargs.get("school") or "",
      "degree": self.kwargs.get("degree") or "",
      "major": self.kwargs.get("major") or "",
      "period": self.kwargs.get("period") or "",
      "display_order": self.kwargs.get("display_order", 0),
    }

    if uuid:
      instance = self.get_or_404(
        ResumeEducation,
        message="학력 항목을 찾을 수 없습니다.",
        pk=uuid,
        resume=resume,
      )
      for k, v in defaults.items():
        setattr(instance, k, v)
      instance.save()
    else:
      instance = ResumeEducation.objects.create(resume=resume, **defaults)

    self._mark_dirty()
    return instance
