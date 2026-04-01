"""
model과 마이그레이션은 1:1로 대응됨
장고가 모델을 읽고 마이그레이션 자동 생성
면접 한 세션에 대해서 요약
"""

from common.models import BaseModel
from django.db import models


class InterviewSession(BaseModel):
  """면접 시뮬레이션 세션 1회 실행 단위."""

  class Meta(BaseModel.Meta):
    db_table = "interview_sessions"
    verbose_name = "Interview Session"
    verbose_name_plural = "Interview Sessions"

  model_name = models.CharField(max_length=50)
  total_input_tokens = models.IntegerField(default=0)
  total_output_tokens = models.IntegerField(default=0)
  total_tokens = models.IntegerField(default=0)
  total_cost_usd = models.DecimalField(max_digits=10, decimal_places=6, default=0)
  is_auto = models.BooleanField(default=False)

  def __str__(self):
    return f"Session {self.id} | {self.model_name} | {self.created_at:%Y-%m-%d %H:%M}"
