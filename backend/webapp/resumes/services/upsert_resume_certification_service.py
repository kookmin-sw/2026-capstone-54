"""ResumeCertification 생성 또는 수정 서비스."""

from common.services import BaseService
from resumes.models import ResumeCertification
from resumes.services.mixins import MarkResumeDirtyMixin


class UpsertResumeCertificationService(MarkResumeDirtyMixin, BaseService):

  required_value_kwargs = ["resume"]

  def execute(self):
    resume = self.kwargs["resume"]
    uuid = self.kwargs.get("uuid")

    defaults = {
      "name": self.kwargs.get("name") or "",
      "issuer": self.kwargs.get("issuer") or "",
      "date": self.kwargs.get("date") or "",
      "display_order": self.kwargs.get("display_order", 0),
    }

    if uuid:
      instance = self.get_or_404(
        ResumeCertification,
        message="자격증 항목을 찾을 수 없습니다.",
        pk=uuid,
        resume=resume,
      )
      for k, v in defaults.items():
        setattr(instance, k, v)
      instance.save()
    else:
      instance = ResumeCertification.objects.create(resume=resume, **defaults)

    self._mark_dirty()
    return instance
