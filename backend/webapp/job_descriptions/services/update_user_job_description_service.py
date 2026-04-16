from common.exceptions import NotFoundException
from common.services import BaseService
from job_descriptions.models import UserJobDescription


class UpdateUserJobDescriptionService(BaseService):
  """사용자 채용공고의 title, application_status 등을 수정하는 서비스."""

  required_value_kwargs = ["uuid"]

  def execute(self):
    uuid = self.kwargs["uuid"]

    try:
      user_job_description = UserJobDescription.objects.get(
        uuid=uuid,
        user=self.user,
      )
    except UserJobDescription.DoesNotExist:
      raise NotFoundException("채용공고를 찾을 수 없습니다.")

    update_fields = ["updated_at"]

    if "title" in self.kwargs:
      user_job_description.title = self.kwargs["title"]
      update_fields.append("title")

    if "application_status" in self.kwargs:
      user_job_description.application_status = self.kwargs["application_status"]
      update_fields.append("application_status")

    user_job_description.save(update_fields=update_fields)
    return user_job_description
