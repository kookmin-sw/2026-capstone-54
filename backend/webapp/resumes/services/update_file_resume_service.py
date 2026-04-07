"""파일 이력서 수정 + 새 파일 시 S3 업로드 + 임베딩 정리 + 파이프라인 재실행."""

from common.services import BaseService
from resumes.services.mixins import FileResumePipelineMixin


class UpdateFileResumeService(FileResumePipelineMixin, BaseService):
  """파일 이력서를 수정하고, 새 파일 업로드 시 기존 파일 삭제 + S3 업로드 + 임베딩 정리 + 파이프라인을 재실행한다."""

  required_value_kwargs = ["resume"]

  def execute(self):
    resume = self.kwargs["resume"]
    title = self.kwargs.get("title")
    uploaded_file = self.kwargs.get("file")

    if title is not None:
      resume.title = title

    resume.save()

    if uploaded_file:
      saved_path = self._replace_file_and_update_content(resume, uploaded_file)
      self._cleanup_embeddings_and_reset(resume)
      self._dispatch_pipeline(resume, type="file", storage_path=f"media/{saved_path}")

    return resume
