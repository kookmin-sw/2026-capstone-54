"""PDF 파일 이력서 생성 + S3 업로드 + store-resume worker 태스크 발행."""

from common.services import BaseService
from resumes.models import FileResume, ResumeFileContent
from resumes.services.mixins import FileResumePipelineMixin


class CreateFileResumeService(FileResumePipelineMixin, BaseService):
  """PDF 파일 이력서를 S3에 업로드하고 store-resume 파이프라인을 시작한다."""

  required_value_kwargs = ["title", "file"]

  def execute(self):
    title = self.kwargs["title"]
    uploaded_file = self.kwargs["file"]

    resume = FileResume.objects.create(user=self.user, title=title)

    saved_path = self._upload_file_to_storage(self.user.id, resume.pk, uploaded_file)

    ResumeFileContent.objects.create(
      user=self.user,
      resume=resume,
      original_filename=uploaded_file.name,
      storage_path=saved_path,
      file_size_bytes=uploaded_file.size,
      mime_type=uploaded_file.content_type,
    )

    self._dispatch_pipeline(resume, type="file", storage_path=f"media/{saved_path}")

    return resume
