from common.models import BaseModelWithUUIDAndSoftDelete
from django.conf import settings
from django.db import models
from django.utils import timezone
from resumes.enums import AnalysisStatus, AnalysisStep, ResumeSourceMode, ResumeType


class Resume(BaseModelWithUUIDAndSoftDelete):
  """사용자 이력서 메타데이터."""

  # Resume 를 복구하면 parsed_data 관련 정규화 sub-model 과 원본 콘텐츠는 함께 복구하지만,
  # - 임베딩: 복구 시점에 모델/텍스트가 달라졌을 수 있어 stale 우려 → 재임베딩 경로로 재생성
  # - 토큰 사용량: 이미 집계된 외부 레코드이므로 hard-delete 유지
  soft_restore_cascade = [
    "basic_info",
    "summary",
    "career_meta",
    "text_content",
    "file_content",
    "experiences",
    "educations",
    "certifications",
    "awards",
    "projects",
    "languages_spoken",
    "resume_skills",
    "resume_industry_domains",
    "resume_keywords",
  ]

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
  resume_job_category = models.ForeignKey(
    "resumes.ResumeJobCategory",
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="resumes",
    verbose_name="감지된 이력서 직군 분류",
  )
  source_mode = models.CharField(
    max_length=20,
    choices=ResumeSourceMode.choices,
    default=ResumeSourceMode.TEXT,
    verbose_name="원본 입력 방식",
    help_text="이력서가 처음 생성된 방식: file / text / structured",
  )
  is_dirty = models.BooleanField(
    default=False,
    verbose_name="변경 대기 상태",
    help_text="정규화 sub-model 이 수정됐으나 최종 저장(재임베딩) 전 상태",
  )
  last_finalized_at = models.DateTimeField(
    null=True,
    blank=True,
    verbose_name="마지막 최종 저장 시각",
    help_text="사용자가 '최종 저장'을 눌러 재임베딩이 수행된 최근 시각",
  )

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
    """분석 완료 상태로 전환한다.

    실제 운영 파이프라인에서는 analysis-resume worker 가 분석을 마친 뒤 Celery 로
    `resumes.tasks.apply_analysis_result` 태스크를 호출하고, backend 가
    `ApplyAnalysisResultService` → `ResumeParsedDataWriter` 경로로 전체 저장을 처리한다.
    이 메서드는 그 플로우에서 한 단계(상태 전환 + parsed_data JSON 저장) 만 담당하는
    얇은 헬퍼이며, ResumeJobCategory FK 매칭 / 정규화 sub-model 기록은
    Writer 가 처리한다.
    """
    self.analysis_status = AnalysisStatus.COMPLETED
    self.analysis_step = AnalysisStep.DONE
    self.is_parsed = True
    self.analyzed_at = timezone.now()
    update_fields = ["analysis_status", "analysis_step", "is_parsed", "analyzed_at", "updated_at"]

    if parsed_data is not None:
      self.parsed_data = parsed_data
      update_fields.append("parsed_data")

    self.save(update_fields=update_fields)

  def mark_failed(self):
    self.analysis_status = AnalysisStatus.FAILED
    self.analyzed_at = None
    self.save(update_fields=["analysis_status", "analyzed_at", "updated_at"])

  def mark_dirty(self):
    """정규화 sub-model 이 수정됐음을 표시. 이미 dirty 면 no-op."""
    if self.is_dirty:
      return
    self.is_dirty = True
    self.save(update_fields=["is_dirty", "updated_at"])

  def mark_finalized(self):
    """최종 저장이 완료됐을 때 호출. dirty flag 해제 + 재임베딩 시각 기록."""
    now = timezone.now()
    self.is_dirty = False
    self.last_finalized_at = now
    self.analyzed_at = now
    self.save(update_fields=["is_dirty", "last_finalized_at", "analyzed_at", "updated_at"])
