from celery import current_app
from common.services import BaseService
from job_descriptions.enums import CollectionStatus
from job_descriptions.models import JobDescription, UserJobDescription


class CreateUserJobDescriptionService(BaseService):
  """
  사용자 채용공고 등록 서비스.

  - 이미 해당 URL로 수집된 JobDescription이 있으면 재사용
  - 없으면 pending 상태로 생성 후 scraping celery task 발행
  """

  required_value_kwargs = ["url"]

  def execute(self):
    url = self.kwargs["url"]
    job_description = JobDescription.objects.filter(url=url).first()

    if job_description is None:
      job_description = JobDescription.objects.create(
        url=url,
        collection_status=CollectionStatus.PENDING,
      )
      self._dispatch_scraping_task(job_description)

    user_job_description = UserJobDescription.objects.create(
      user=self.user,
      job_description=job_description,
    )
    return user_job_description

  @staticmethod
  def _dispatch_scraping_task(job_description):
    current_app.send_task(
      "scraping.tasks.scrape_job_posting",
      args=[job_description.id, job_description.url],
      queue="scraping",
    )
