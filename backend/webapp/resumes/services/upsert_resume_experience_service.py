"""ResumeExperience 생성 또는 수정 서비스."""

from common.services import BaseService
from resumes.models import ResumeExperience
from resumes.services.mixins import MarkResumeDirtyMixin


class UpsertResumeExperienceService(MarkResumeDirtyMixin, BaseService):
  """uuid 가 있으면 update, 없으면 create."""

  required_value_kwargs = ["resume"]

  def execute(self):
    resume = self.kwargs["resume"]
    uuid = self.kwargs.get("uuid")

    defaults = {
      "company": self.kwargs.get("company") or "",
      "role": self.kwargs.get("role") or "",
      "period": self.kwargs.get("period") or "",
      "responsibilities": list(self.kwargs.get("responsibilities") or []),
      "highlights": list(self.kwargs.get("highlights") or []),
      "display_order": self.kwargs.get("display_order", 0),
    }

    if uuid:
      instance = self.get_or_404(
        ResumeExperience,
        message="경력 항목을 찾을 수 없습니다.",
        pk=uuid,
        resume=resume,
      )
      for k, v in defaults.items():
        setattr(instance, k, v)
      instance.save()
    else:
      instance = ResumeExperience.objects.create(resume=resume, **defaults)

    self._mark_dirty()
    return instance
