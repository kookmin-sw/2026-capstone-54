"""이력서 soft delete 서비스."""

from common.services import BaseService


class DeleteResumeService(BaseService):
  """이력서를 soft delete한다. BaseModelWithSoftDelete의 delete()를 호출하여 deleted_at을 설정한다."""

  required_value_kwargs = ["resume"]

  def execute(self):
    resume = self.kwargs["resume"]
    resume.delete()
    return resume
