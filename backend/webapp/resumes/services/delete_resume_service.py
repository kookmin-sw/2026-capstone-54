"""이력서 soft delete 서비스."""

from common.exceptions import ConflictException
from common.services import BaseService
from resumes.enums import AnalysisStatus


class DeleteResumeService(BaseService):
  """이력서를 soft delete한다. BaseModelWithSoftDelete의 delete()를 호출하여 deleted_at을 설정한다."""

  required_value_kwargs = ["resume"]

  def validate(self):
    resume = self.kwargs["resume"]
    if resume.analysis_status in (
      AnalysisStatus.PENDING,
      AnalysisStatus.PROCESSING,
    ):
      raise ConflictException("분석 중인 이력서는 삭제할 수 없습니다.")

  def execute(self):
    resume = self.kwargs["resume"]
    resume.delete()
    return resume
