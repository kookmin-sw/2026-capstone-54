"""
model과 마이그레이션은 1:1로 대응됨
장고가 모델을 읽고 마이그레이션 자동 생성
면접 한 세션에 대해서 요약
"""

from common.models import BaseModel
from django.db import models
from interview.enums import InterviewDifficultyLevel, InterviewSessionStatus


class InterviewSession(BaseModel):
  """면접 시뮬레이션 세션 1회 실행 단위."""

  class Meta(BaseModel.Meta):
    db_table = "interview_sessions"
    verbose_name = "Interview Session"
    verbose_name_plural = "Interview Sessions"

  # 기본 정보
  model_name = models.CharField(max_length=50)
  difficulty_level = models.CharField(
    max_length=10, choices=InterviewDifficultyLevel.choices, default=InterviewDifficultyLevel.NORMAL
  )
  is_auto = models.BooleanField(default=False)

  # 상태 & 시간
  status = models.CharField(
    max_length=15,
    choices=InterviewSessionStatus.choices,
    default=InterviewSessionStatus.IN_PROGRESS,
  )
  started_at = models.DateTimeField(null=True, blank=True, help_text="면접 시작 시간 (첫 질문 생성 완료 시점)")
  finished_at = models.DateTimeField(null=True, blank=True, help_text="면접 종료 시간")
  duration_seconds = models.IntegerField(null=True, blank=True, help_text="총 소요 시간 (초)")

  # 질문 통계
  total_initial_questions = models.IntegerField(default=0, help_text="메인 질문 수")
  total_followup_questions = models.IntegerField(default=0, help_text="꼬리질문 수")

  # 답변 통계
  avg_answer_length = models.IntegerField(default=0, help_text="평균 답변 길이 (글자 수)")

  # 토큰 & 비용
  total_input_tokens = models.IntegerField(default=0)
  total_output_tokens = models.IntegerField(default=0)
  total_tokens = models.IntegerField(default=0)
  total_cost_usd = models.DecimalField(max_digits=10, decimal_places=6, default=0)

  # 문서 정보
  resume_file = models.CharField(max_length=255, blank=True, default="", help_text="사용된 이력서 파일명")
  job_posting_file = models.CharField(max_length=255, blank=True, default="", help_text="사용된 채용공고 파일명")

  # RAG 정보
  total_chunks_retrieved = models.IntegerField(default=0, help_text="RAG에서 검색된 총 청크 수")

  # 질문 메타데이터 캐시 (질문 텍스트 → source 매핑)
  question_sources = models.JSONField(default=dict, blank=True, help_text="질문별 source 매핑 {question_text: source}")

  def __str__(self):
    return f"Session {self.id} | {self.model_name} | {self.status} | {self.created_at:%Y-%m-%d %H:%M}"
