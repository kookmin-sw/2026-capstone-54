"""
면접 분석 리포트 모델
완료된 면접 세션에 대한 LLM 기반 종합 분석 결과를 저장한다.
"""

from common.models import BaseModel
from django.db import models
from interview.models.interview_session import InterviewSession


class AnalysisReport(BaseModel):
  """면접 세션에 대한 종합 분석 리포트."""

  class Status(models.TextChoices):
    GENERATING = "generating", "생성 중"
    COMPLETED = "completed", "완료"
    FAILED = "failed", "실패"

  class Meta(BaseModel.Meta):
    db_table = "analysis_reports"
    verbose_name = "Analysis Report"
    verbose_name_plural = "Analysis Reports"

  session = models.OneToOneField(InterviewSession, on_delete=models.CASCADE, related_name="report")
  status = models.CharField(max_length=15, choices=Status.choices, default=Status.GENERATING)
  error_message = models.TextField(blank=True, default="")

  # 종합 점수
  overall_score = models.IntegerField(null=True)
  overall_grade = models.CharField(max_length=20, blank=True, default="")
  overall_comment = models.TextField(blank=True, default="")

  # 답변 평가 (6개 카테고리)
  category_scores = models.JSONField(default=list)

  # 질문별 상세 피드백
  question_feedbacks = models.JSONField(default=list)

  # 강점 및 개선 영역
  strengths = models.JSONField(default=list)
  improvement_areas = models.JSONField(default=list)

  # 토큰 사용량
  input_tokens = models.IntegerField(default=0)
  output_tokens = models.IntegerField(default=0)
  total_tokens = models.IntegerField(default=0)
  total_cost_usd = models.DecimalField(max_digits=10, decimal_places=6, default=0)

  def __str__(self):
    return f"Report {self.id} | Session {self.session_id} | {self.status}"
