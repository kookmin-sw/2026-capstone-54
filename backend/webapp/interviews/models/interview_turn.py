"""면접 턴(질문·답변 쌍) 모델."""

from common.models import BaseModel
from django.db import models
from interviews.enums import InterviewExchangeType, QuestionSource


class InterviewTurn(BaseModel):
  """면접 세션 내 하나의 질문·답변 쌍.

    초기 질문(INITIAL)과 꼬리질문(FOLLOWUP) 모두 이 모델로 기록한다.
    """

  class Meta(BaseModel.Meta):
    db_table = "interview_turns"
    verbose_name = "면접 턴"
    verbose_name_plural = "면접 턴 목록"
    ordering = ["created_at"]

  interview_session = models.ForeignKey(
    "interviews.InterviewSession",
    on_delete=models.CASCADE,
    related_name="turns",
    verbose_name="면접 세션",
  )

  turn_type = models.CharField(
    max_length=10,
    choices=InterviewExchangeType.choices,
    verbose_name="턴 유형",
  )
  question_source = models.CharField(
    max_length=20,
    choices=QuestionSource.choices,
    default=QuestionSource.UNKNOWN,
    verbose_name="질문 출처",
  )

  question = models.TextField(verbose_name="질문")
  answer = models.TextField(blank=True, default="", verbose_name="답변")

  turn_number = models.PositiveIntegerField(default=1, verbose_name="턴 번호")

  anchor_turn = models.ForeignKey(
    "self",
    null=True,
    blank=True,
    on_delete=models.SET_NULL,
    related_name="followup_turns",
    verbose_name="앵커 질문",
  )

  def __str__(self):
    return f"InterviewTurn #{self.pk} [{self.get_turn_type_display()}] (Session {self.interview_session_id})"
