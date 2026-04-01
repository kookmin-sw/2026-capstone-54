"""
질문+답변 1쌍 저장
"""

from common.models import BaseModel
from django.db import models
from interview.models.interview_session import InterviewSession


class InterviewExchange(BaseModel):
  """세션 내 질문-답변 1쌍."""

  class ExchangeType(models.TextChoices):
    INITIAL = "initial", "초기 질문"
    FOLLOWUP = "followup", "꼬리질문"

  class Meta(BaseModel.Meta):
    db_table = "interview_exchanges"
    verbose_name = "Interview Exchange"
    verbose_name_plural = "Interview Exchanges"

  """
  session = 어떤 세션인지
  exchange_type = 초기질문인지, 꼬리질문인지
  depth = 깊이
  question = GPT가 생성한 질문 텍스트
  answer = 답변 텍스트
  """

  session = models.ForeignKey(InterviewSession, on_delete=models.CASCADE, related_name="exchanges")
  exchange_type = models.CharField(max_length=10, choices=ExchangeType.choices)
  depth = models.IntegerField(default=0)  # 0=초기, 1~=꼬리질문 깊이
  question = models.TextField()
  answer = models.TextField()
  input_tokens = models.IntegerField(default=0)
  output_tokens = models.IntegerField(default=0)
  total_tokens = models.IntegerField(default=0)

  def __str__(self):
    return f"Exchange {self.id} | {self.exchange_type} depth={self.depth}"
