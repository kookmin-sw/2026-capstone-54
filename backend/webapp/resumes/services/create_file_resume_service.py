"""PDF 파일 이력서 생성 + S3 업로드 + store-resume worker 태스크 발행."""

import uuid

from celery import current_app
from common.services import BaseService
from django.core.files.storage import default_storage
from resumes.models import FileResume, ResumeFileContent


class CreateFileResumeService(BaseService):
  """PDF 파일 이력서를 S3에 업로드하고 store-resume 파이프라인을 시작한다."""

  required_value_kwargs = ["title", "file"]

  def execute(self):
    title = self.kwargs["title"]
    uploaded_file = self.kwargs["file"]

    resume = FileResume.objects.create(
      user=self.user,
      title=title,
    )

    # S3 업로드
    ext = uploaded_file.name.rsplit(".", 1)[-1] if "." in uploaded_file.name else "pdf"
    storage_path = f"resumes/{self.user.id}/{resume.pk}/{uuid.uuid4().hex}.{ext}"
    saved_path = default_storage.save(storage_path, uploaded_file)

    ResumeFileContent.objects.create(
      user=self.user,
      resume=resume,
      original_filename=uploaded_file.name,
      storage_path=saved_path,
      file_size_bytes=uploaded_file.size,
      mime_type=uploaded_file.content_type,
    )

    current_app.send_task(
      "store_resume.tasks.process_resume",
      kwargs={
        "resume_uuid": str(resume.pk),
        "user_id": self.user.id,
        "resume_type": "file",
        "storage_path": f"media/{saved_path}",
      },
      queue="store-resume",
    )

    return resume
