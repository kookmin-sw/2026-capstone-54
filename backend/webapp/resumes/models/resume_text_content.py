from common.models import BaseModelWithSoftDelete
from django.conf import settings
from django.db import models


class ResumeTextContent(BaseModelWithSoftDelete):
  """resume_type='text' 이력서의 자유 텍스트 본문."""

  class Meta(BaseModelWithSoftDelete.Meta):
    db_table = "resume_text_contents"
    verbose_name = "Resume Text Content"
    verbose_name_plural = "Resume Text Contents"

  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="resume_text_contents",
    db_column="user_id",
  )
  resume = models.OneToOneField(
    "resumes.Resume",
    on_delete=models.CASCADE,
    related_name="text_content",
  )
  content = models.TextField()

  def __str__(self):
    return f"ResumeTextContent {self.pk} | resume={self.resume_id}"
