"""파일 이력서 서비스 공통 로직: S3 업로드, 기존 파일 삭제, FileContent 갱신."""

import uuid

from django.core.files.storage import default_storage
from resumes.services.mixins.resume_pipeline_mixin import ResumePipelineMixin


class FileResumePipelineMixin(ResumePipelineMixin):
  """파일 이력서 Create/Update 서비스가 공유하는 파일 처리 유틸리티."""

  def _upload_file_to_storage(self, user_id, resume_pk, uploaded_file):
    """S3에 파일을 업로드하고 저장 경로를 반환한다."""
    ext = uploaded_file.name.rsplit(".", 1)[-1] if "." in uploaded_file.name else "pdf"
    storage_path = f"resumes/{user_id}/{resume_pk}/{uuid.uuid4().hex}.{ext}"
    return default_storage.save(storage_path, uploaded_file)

  def _replace_file_and_update_content(self, resume, uploaded_file):
    """기존 S3 파일을 삭제하고 새 파일을 업로드한 뒤 ResumeFileContent를 갱신한다.

    Returns:
      저장된 파일의 storage path.
    """
    file_content = resume.file_content

    # 기존 파일 삭제
    file_content._delete_storage_file()

    # 새 파일 업로드
    saved_path = self._upload_file_to_storage(resume.user_id, resume.pk, uploaded_file)

    # FileContent 갱신
    file_content.original_filename = uploaded_file.name
    file_content.storage_path = saved_path
    file_content.file_size_bytes = uploaded_file.size
    file_content.mime_type = uploaded_file.content_type
    file_content.save(update_fields=["original_filename", "storage_path", "file_size_bytes", "mime_type", "updated_at"])

    return saved_path
