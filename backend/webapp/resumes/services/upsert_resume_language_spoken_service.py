"""ResumeLanguageSpoken 생성 또는 수정 서비스."""

from common.services import BaseService
from resumes.models import ResumeLanguageSpoken
from resumes.services.mixins import MarkResumeDirtyMixin


class UpsertResumeLanguageSpokenService(MarkResumeDirtyMixin, BaseService):

  required_value_kwargs = ["resume"]

  def execute(self):
    resume = self.kwargs["resume"]
    uuid = self.kwargs.get("uuid")

    defaults = {
      "language": self.kwargs.get("language") or "",
      "level": self.kwargs.get("level") or "",
      "display_order": self.kwargs.get("display_order", 0),
    }

    if uuid:
      instance = self.get_or_404(
        ResumeLanguageSpoken,
        message="구사 언어 항목을 찾을 수 없습니다.",
        pk=uuid,
        resume=resume,
      )
      for k, v in defaults.items():
        setattr(instance, k, v)
      instance.save()
    else:
      instance = ResumeLanguageSpoken.objects.create(resume=resume, **defaults)

    self._mark_dirty()
    return instance
