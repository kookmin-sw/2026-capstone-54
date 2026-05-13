from common.exceptions import ConflictException
from common.services import BaseService
from job_descriptions.enums import CollectionStatus


class DeleteUserJobDescriptionService(BaseService):
  required_value_kwargs = ["user_job_description"]

  def validate(self):
    user_job_description = self.kwargs["user_job_description"]
    if user_job_description.job_description.collection_status in (
      CollectionStatus.PENDING,
      CollectionStatus.IN_PROGRESS,
    ):
      raise ConflictException("수집 중인 채용공고는 삭제할 수 없습니다.")

  def execute(self):
    user_job_description = self.kwargs["user_job_description"]
    user_job_description.delete()
