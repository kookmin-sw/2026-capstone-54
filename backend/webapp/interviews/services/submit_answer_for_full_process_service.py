from __future__ import annotations

import logging

from common.services.base_service import BaseService
from django.core.exceptions import ValidationError
from interviews.enums import InterviewSessionStatus, InterviewSessionType
from interviews.models import InterviewSession, InterviewTurn

logger = logging.getLogger(__name__)


class SubmitAnswerForFullProcessService(BaseService):
  """전체 프로세스 면접의 답변 저장 서비스 (꼬리질문 생성 없음).

    다음 미답변 턴을 반환한다.
    """

  required_value_kwargs = ["interview_session", "interview_turn", "answer"]

  def validate(self):
    interview_session: InterviewSession = self.kwargs["interview_session"]
    interview_turn: InterviewTurn = self.kwargs["interview_turn"]
    answer: str = self.kwargs["answer"]

    if interview_session.interview_session_status != InterviewSessionStatus.IN_PROGRESS:
      raise ValidationError("진행 중인 세션에서만 답변을 제출할 수 있습니다.")

    if interview_session.interview_session_type != InterviewSessionType.FULL_PROCESS:
      raise ValidationError("이 서비스는 FULL_PROCESS 세션 타입 전용입니다.")

    if interview_turn.interview_session_id != interview_session.pk:
      raise ValidationError("해당 세션의 턴이 아닙니다.")

    if interview_turn.answer:
      raise ValidationError("이미 답변이 제출된 턴입니다.")

    if not answer or not answer.strip():
      raise ValidationError("답변 내용이 비어있습니다.")

  def execute(self) -> InterviewTurn | None:
    """답변을 저장하고 다음 미답변 턴을 반환한다. 모두 완료되면 None을 반환한다."""
    interview_turn: InterviewTurn = self.kwargs["interview_turn"]
    answer: str = self.kwargs["answer"]

    interview_turn.answer = answer.strip()
    interview_turn.save(update_fields=["answer", "updated_at"])

    return (
      InterviewTurn.objects.filter(interview_session=interview_turn.interview_session,
                                   answer="").order_by("turn_number").first()
    )
