from common.models import BaseModelWithSoftDelete
from django.conf import settings
from django.db import models


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
