"""ResumeProject 단일 삭제 서비스."""

from common.services import BaseService
from resumes.models import ResumeProject
from resumes.services.mixins import MarkResumeDirtyMixin


class DeleteResumeProjectService(MarkResumeDirtyMixin, BaseService):

  required_value_kwargs = ["resume", "uuid"]

  def execute(self):
    resume = self.kwargs["resume"]
    instance = self.get_or_404(
      ResumeProject,
      message="프로젝트 항목을 찾을 수 없습니다.",
      pk=self.kwargs["uuid"],
      resume=resume,
    )
    instance.delete()
    self._mark_dirty()
    return True
