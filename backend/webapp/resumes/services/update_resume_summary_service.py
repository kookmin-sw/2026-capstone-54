"""이력서 요약(ResumeSummary) upsert 서비스."""

from common.services import BaseService
from resumes.models import ResumeSummary
from resumes.services.mixins import MarkResumeDirtyMixin


class UpdateResumeSummaryService(MarkResumeDirtyMixin, BaseService):
  """ResumeSummary 를 upsert 한다."""

  required_value_kwargs = ["resume"]

  def execute(self):
    resume = self.kwargs["resume"]
    instance, _ = ResumeSummary.objects.update_or_create(
      resume=resume,
      defaults={"text": self.kwargs.get("text") or ""},
    )
    self._mark_dirty()
    return instance
