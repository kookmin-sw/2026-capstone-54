import logging

from common.models import BaseModelWithSoftDelete
from django.conf import settings
from django.core.files.storage import default_storage
from django.db import models

logger = logging.getLogger(__name__)


class ResumeFileContent(BaseModelWithSoftDelete):
  """resume_type='file' 이력서의 파일 메타데이터."""

  class Meta(BaseModelWithSoftDelete.Meta):
    db_table = "resume_file_contents"
    verbose_name = "Resume File Content"
    verbose_name_plural = "Resume File Contents"
    indexes = [
      models.Index(fields=["-created_at"]),
    ]

  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="resume_file_contents",
    db_column="user_id",
  )
  resume = models.OneToOneField(
    "resumes.Resume",
    on_delete=models.CASCADE,
    related_name="file_content",
  )
  original_filename = models.CharField(max_length=255)
  storage_path = models.CharField(max_length=500)
  file_size_bytes = models.BigIntegerField(null=True, blank=True)
  mime_type = models.CharField(max_length=100, null=True, blank=True)
  content = models.TextField(null=True, blank=True)

  def __str__(self):
    return f"ResumeFileContent {self.pk} | {self.original_filename}"

  def delete(self, using=None, keep_parents=False):
    """soft delete 시 S3에 저장된 실제 파일도 함께 삭제한다."""
    self._delete_storage_file()
    super().delete(using=using, keep_parents=keep_parents)

  def hard_delete(self, using=None, keep_parents=False):
    """hard delete 시에도 S3 파일을 삭제한다."""
    self._delete_storage_file()
    super().hard_delete(using=using, keep_parents=keep_parents)

  def _delete_storage_file(self):
    """storage_path에 해당하는 파일이 존재하면 삭제한다."""
    if not self.storage_path:
      return
    try:
      if default_storage.exists(self.storage_path):
        default_storage.delete(self.storage_path)
    except Exception:
      logger.exception("S3 파일 삭제 실패: %s", self.storage_path)
