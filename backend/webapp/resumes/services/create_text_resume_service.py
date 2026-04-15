"""텍스트 이력서 생성 + analysis-resume worker 태스크 발행."""

from common.services import BaseService
from resumes.enums import ResumeSourceMode
from resumes.models import ResumeTextContent, TextResume
from resumes.services.mixins import ResumePipelineMixin


class CreateTextResumeService(ResumePipelineMixin, BaseService):
  """텍스트 이력서를 생성하고 analysis-resume 파이프라인을 시작한다."""

  required_value_kwargs = ["title", "content"]

  def execute(self):
    title = self.kwargs["title"]
    content = self.kwargs["content"]

    resume = TextResume.objects.create(user=self.user, title=title, source_mode=ResumeSourceMode.TEXT)
    ResumeTextContent.objects.create(user=self.user, resume=resume, content=content)

    self._dispatch_pipeline(resume, type="text", text=content)

    return resume
