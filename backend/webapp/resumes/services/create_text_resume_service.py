"""텍스트 이력서 생성 + store-resume worker 태스크 발행."""

from celery import current_app
from common.services import BaseService
from resumes.models import ResumeTextContent, TextResume


class CreateTextResumeService(BaseService):
  """텍스트 이력서를 생성하고 store-resume 파이프라인을 시작한다."""

  required_value_kwargs = ["title", "content"]

  def execute(self):
    title = self.kwargs["title"]
    content = self.kwargs["content"]

    resume = TextResume.objects.create(
      user=self.user,
      title=title,
    )
    ResumeTextContent.objects.create(
      user=self.user,
      resume=resume,
      content=content,
    )

    current_app.send_task(
      "store_resume.tasks.process_resume",
      kwargs={
        "resume_uuid": str(resume.pk),
        "user_id": self.user.id,
        "type": "text",
        "text": content,
      },
      queue="store-resume",
    )

    return resume
