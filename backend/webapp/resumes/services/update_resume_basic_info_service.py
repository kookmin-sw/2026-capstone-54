"""이력서 기본 정보(ResumeBasicInfo) upsert 서비스."""

from common.services import BaseService
from resumes.models import ResumeBasicInfo
from resumes.services.mixins import MarkResumeDirtyMixin


class UpdateResumeBasicInfoService(MarkResumeDirtyMixin, BaseService):
  """ResumeBasicInfo 를 upsert 한다. 1:1 이므로 resume 당 1건만 존재."""

  required_value_kwargs = ["resume"]

  def execute(self):
    resume = self.kwargs["resume"]
    instance, _ = ResumeBasicInfo.objects.update_or_create(
      resume=resume,
      defaults={
        "name": self.kwargs.get("name") or "",
        "email": self.kwargs.get("email") or "",
        "phone": self.kwargs.get("phone") or "",
        "location": self.kwargs.get("location") or "",
      },
    )
    self._mark_dirty()
    return instance
