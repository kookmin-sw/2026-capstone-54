"""텍스트 이력서 수정 + 내용 변경 시 임베딩 정리 + 파이프라인 재실행."""

from common.services import BaseService
from resumes.services.mixins import ResumePipelineMixin


class UpdateTextResumeService(ResumePipelineMixin, BaseService):
  """텍스트 이력서를 수정하고, 내용 변경 시 임베딩을 정리한 뒤 store-resume 파이프라인을 재실행한다."""

  required_value_kwargs = ["resume"]

  def execute(self):
    resume = self.kwargs["resume"]
    title = self.kwargs.get("title")
    content = self.kwargs.get("content")

    if title is not None:
      resume.title = title

    if content is not None:
      resume.text_content.content = content
      resume.text_content.save(update_fields=["content", "updated_at"])

    resume.save()

    if content is not None:
      self._cleanup_embeddings_and_reset(resume)
      self._dispatch_pipeline(resume, type="text", text=content)

    return resume
