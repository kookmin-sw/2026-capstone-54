"""이력서 경력 메타(ResumeCareerMeta) upsert 서비스."""

from common.services import BaseService
from resumes.models import ResumeCareerMeta
from resumes.services.mixins import MarkResumeDirtyMixin


class UpdateResumeCareerMetaService(MarkResumeDirtyMixin, BaseService):
  """ResumeCareerMeta 를 upsert 한다. years/months 분리 관리."""

  required_value_kwargs = ["resume"]

  def execute(self):
    resume = self.kwargs["resume"]
    instance, _ = ResumeCareerMeta.objects.update_or_create(
      resume=resume,
      defaults={
        "total_experience_years": self.kwargs.get("total_experience_years"),
        "total_experience_months": self.kwargs.get("total_experience_months"),
      },
    )
    self._mark_dirty()
    return instance
