"""면접 턴(질문·답변 쌍) 모델."""

from common.models import BaseModel
from django.db import models
from interviews.enums import InterviewExchangeType, QuestionSource


class InterviewTurn(BaseModel):
  """면접 세션 내 하나의 질문·답변 쌍.

    초기 질문(INITIAL)과 꼬리질문(FOLLOWUP) 모두 이 모델로 기록한다.

    turn_number: 앵커 질문의 순번 (1, 2, 3...). follow-up은 앵커와 동일한 값
    followup_order: follow-up의 그룹 내 순번 (1, 2, 3...). 앵커는 NULL

    정렬: turn_number ASC, followup_order ASC (NULL=0 먼저)
    - 앵커1 → turn_number=1, followup_order=NULL
    - 앵커1-FU1 → turn_number=1, followup_order=1
    - 앵커1-FU2 → turn_number=1, followup_order=2
    - 앵커2 → turn_number=2, followup_order=NULL
    - 앵커2-FU1 → turn_number=2, followup_order=1
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

  turn_number = models.PositiveIntegerField(
    default=1,
    verbose_name="턴 번호",
    help_text="앵커는 1부터 순차, follow-up은 앵커와 동일",
  )

  followup_order = models.PositiveIntegerField(
    null=True,
    blank=True,
    verbose_name="꼬리질문 순번",
    help_text="follow-up인 경우에만 값이 있음 (1부터 순차)",
  )

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
