from common.models import BaseModelWithUUIDAndSoftDelete
from django.conf import settings
from django.db import models
from django.utils import timezone
from resumes.enums import AnalysisStatus, AnalysisStep, ResumeType


class Resume(BaseModelWithUUIDAndSoftDelete):
  """사용자 이력서 메타데이터."""

  class Meta(BaseModelWithUUIDAndSoftDelete.Meta):
    db_table = "resumes"
    verbose_name = "Resume"
    verbose_name_plural = "Resumes"

  user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name="resumes",
    db_column="user_id",
  )
  type = models.CharField(
    max_length=20,
    choices=ResumeType.choices,
    db_column="type",
  )
  title = models.CharField(max_length=255)
  is_active = models.BooleanField(default=True)
  is_parsed = models.BooleanField(default=False)
  parsed_data = models.JSONField(null=True, blank=True)
  analysis_status = models.CharField(
    max_length=20,
    choices=AnalysisStatus.choices,
    default=AnalysisStatus.PENDING,
  )
  analysis_step = models.CharField(
    max_length=30,
    choices=AnalysisStep.choices,
    default=AnalysisStep.QUEUED,
  )
  analyzed_at = models.DateTimeField(null=True, blank=True)

  def __str__(self):
    return f"Resume {self.pk} | {self.user_id} | {self.title}"

  def mark_processing(self, step: str = AnalysisStep.QUEUED):
    self.analysis_status = AnalysisStatus.PROCESSING
    self.analysis_step = step
    self.save(update_fields=["analysis_status", "analysis_step", "updated_at"])

  def mark_step(self, step: str):
    self.analysis_step = step
    self.save(update_fields=["analysis_step", "updated_at"])

  def mark_completed(self, parsed_data: dict | None = None):
    self.analysis_status = AnalysisStatus.COMPLETED
    self.analysis_step = AnalysisStep.DONE
    self.is_parsed = True
    self.analyzed_at = timezone.now()
    if parsed_data is not None:
      self.parsed_data = parsed_data
    self.save(
      update_fields=["analysis_status", "analysis_step", "is_parsed", "analyzed_at", "parsed_data", "updated_at"]
    )

  def mark_failed(self):
    self.analysis_status = AnalysisStatus.FAILED
    self.analyzed_at = None
    self.save(update_fields=["analysis_status", "analyzed_at", "updated_at"])
