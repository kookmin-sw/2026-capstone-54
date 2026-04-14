"""ResumeAward 생성 또는 수정 서비스."""

from common.services import BaseService
from resumes.models import ResumeAward
from resumes.services.mixins import MarkResumeDirtyMixin


class UpsertResumeAwardService(MarkResumeDirtyMixin, BaseService):

  required_value_kwargs = ["resume"]

  def execute(self):
    resume = self.kwargs["resume"]
    uuid = self.kwargs.get("uuid")

    defaults = {
      "name": self.kwargs.get("name") or "",
      "year": self.kwargs.get("year") or "",
      "organization": self.kwargs.get("organization") or "",
      "description": self.kwargs.get("description") or "",
      "display_order": self.kwargs.get("display_order", 0),
    }

    if uuid:
      instance = self.get_or_404(
        ResumeAward,
        message="수상 이력 항목을 찾을 수 없습니다.",
        pk=uuid,
        resume=resume,
      )
      for k, v in defaults.items():
        setattr(instance, k, v)
      instance.save()
    else:
      instance = ResumeAward.objects.create(resume=resume, **defaults)

    self._mark_dirty()
    return instance
