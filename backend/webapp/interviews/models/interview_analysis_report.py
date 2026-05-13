"""면접 분석 리포트 모델."""

from common.models import BaseModel
from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from interviews.enums import InterviewAnalysisReportStatus


class InterviewAnalysisReport(BaseModel):
  """면접 세션 종료 후 AI가 생성하는 종합 분석 리포트.

    interview-analysis-report Celery worker가 비동기로 채운다.
    토큰 사용량은 TokenUsage 모델을 통해 관리한다.
    """

  class Meta(BaseModel.Meta):
    db_table = "interview_analysis_reports"
    verbose_name = "면접 분석 리포트"
    verbose_name_plural = "면접 분석 리포트 목록"

  interview_session = models.OneToOneField(
    "interviews.InterviewSession",
    on_delete=models.CASCADE,
    related_name="analysis_report",
    verbose_name="면접 세션",
  )
  interview_analysis_report_status = models.CharField(
    max_length=15,
    choices=InterviewAnalysisReportStatus.choices,
    default=InterviewAnalysisReportStatus.PENDING,
    verbose_name="리포트 상태",
  )
  error_message = models.TextField(blank=True, default="", verbose_name="에러 메시지")

  # 종합 평가
  overall_score = models.IntegerField(null=True, blank=True, verbose_name="종합 점수")
  overall_grade = models.CharField(max_length=20, blank=True, default="", verbose_name="종합 등급")
  overall_comment = models.TextField(blank=True, default="", verbose_name="종합 코멘트")

  # 상세 분석 (JSON)
  category_scores = models.JSONField(default=list, verbose_name="카테고리별 점수")
  question_feedbacks = models.JSONField(default=list, verbose_name="질문별 피드백")
  strengths = models.JSONField(default=list, verbose_name="강점")
  improvement_areas = models.JSONField(default=list, verbose_name="개선 영역")

  # 영상 분석
  video_score = models.IntegerField(null=True, blank=True, verbose_name="영상 점수")
  video_analysis_result = models.JSONField(default=dict, blank=True, verbose_name="영상 분석 결과")
  video_analysis_comment = models.TextField(blank=True, default="", verbose_name="영상 분석 코멘트")

  # 음성 분석
  audio_score = models.IntegerField(null=True, blank=True, verbose_name="음성 점수")
  audio_analysis_result = models.JSONField(default=dict, blank=True, verbose_name="음성 분석 결과")
  audio_analysis_comment = models.TextField(blank=True, default="", verbose_name="음성 분석 코멘트")

  # 텍스트 분석
  content_score = models.IntegerField(null=True, blank=True, verbose_name="텍스트 점수")

  # TokenUsage 역방향 Generic Relation (토큰 사용 상세 내역)
  token_usages = GenericRelation(
    "llm_trackers.TokenUsage",
    content_type_field="token_usable_type",
    object_id_field="token_usable_id",
  )

  def __str__(self):
    return f"AnalysisReport #{self.pk} [{self.get_interview_analysis_report_status_display()}]"

  def mark_generating(self) -> None:
    self.interview_analysis_report_status = InterviewAnalysisReportStatus.GENERATING
    self.save(update_fields=["interview_analysis_report_status", "updated_at"])

  def mark_completed(self) -> None:
    self.interview_analysis_report_status = InterviewAnalysisReportStatus.COMPLETED
    self.save(update_fields=["interview_analysis_report_status", "updated_at"])

  def mark_failed(self, message: str = "") -> None:
    self.interview_analysis_report_status = InterviewAnalysisReportStatus.FAILED
    self.error_message = message
    self.save(update_fields=["interview_analysis_report_status", "error_message", "updated_at"])
