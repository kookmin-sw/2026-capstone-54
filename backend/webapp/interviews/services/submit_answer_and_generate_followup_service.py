"""꼬리질문 생성 서비스.

직전 턴에 대한 답변을 저장하고 꼬리질문을 생성한다.
LLM 호출은 트랜잭션 외부에서 수행하여 DB 커넥션 점유 시간을 최소화한다.

정책 (constants.py):
- 앵커 질문: FOLLOWUP_ANCHOR_COUNT개
- 앵커당 최대 꼬리질문: MAX_FOLLOWUP_PER_ANCHOR개
- 앵커 체인이 소진되면 다음 앵커를 반환, 모든 앵커 소진 시 followup_exhausted=True
"""

from __future__ import annotations

import logging
from typing import NamedTuple

from common.services.base_service import BaseService
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Max
from interviews.constants import MAX_FOLLOWUP_PER_ANCHOR
from interviews.enums import InterviewExchangeType, InterviewSessionStatus, InterviewSessionType, QuestionSource
from interviews.models import InterviewSession, InterviewTurn
from interviews.schemas import FollowUpGeneratorInput, FollowUpGeneratorOutput
from interviews.services.content_service import get_job_description_content, get_resume_content
from interviews.services.llm import FollowUpQuestionGenerator, TokenUsageCallback, calculate_cost
from llm_trackers.enums import TokenOperation, TokenUsageContext
from llm_trackers.models import TokenUsage

logger = logging.getLogger(__name__)


class FollowupResult(NamedTuple):
  """꼬리질문 생성 결과."""
  turns: list[InterviewTurn]
  followup_exhausted: bool  # True: 모든 앵커 체인 소진 (= 면접 종료 신호)


class SubmitAnswerAndGenerateFollowupService(BaseService):
  """답변 저장 + 꼬리질문 생성 서비스 (FOLLOWUP 세션 타입 전용).

  LLM 호출을 트랜잭션 밖에서 수행하고,
  결과를 DB에 저장하는 execute()만 트랜잭션 안에서 실행한다.

  앵커 체인이 소진되면:
  - 다음 앵커가 있으면 → turns=[next_anchor], followup_exhausted=False
  - 다음 앵커도 없으면 → turns=[], followup_exhausted=True
  """

  required_value_kwargs = ["interview_session", "interview_turn", "answer"]

  def perform(self) -> FollowupResult:
    self._validate_kwargs()
    self._build_kwargs()
    self.validate()

    anchor = self._get_anchor()
    followup_count = anchor.followup_turns.count()

    if followup_count >= MAX_FOLLOWUP_PER_ANCHOR:
      # 이 앵커의 꼬리질문 한도 도달 → 답변 저장 후 다음 앵커 반환
      with transaction.atomic():
        return self._complete_anchor_chain(anchor)

    self._llm_output, self._callback = self._call_llm()

    with transaction.atomic():
      return self.execute(anchor)

  def _build_kwargs(self):
    self.interview_session: InterviewSession = self.kwargs["interview_session"]
    self.interview_turn: InterviewTurn = self.kwargs["interview_turn"]
    self.answer: str = self.kwargs["answer"]

  def validate(self):
    if self.interview_session.interview_session_status != InterviewSessionStatus.IN_PROGRESS:
      raise ValidationError("진행 중인 세션에서만 답변을 제출할 수 있습니다.")

    if self.interview_session.interview_session_type != InterviewSessionType.FOLLOWUP:
      raise ValidationError("꼬리질문 생성은 FOLLOWUP 세션 타입에서만 가능합니다.")

    if self.interview_turn.interview_session_id != self.interview_session.pk:
      raise ValidationError("해당 세션의 턴이 아닙니다.")

    if self.interview_turn.answer:
      raise ValidationError("이미 답변이 제출된 턴입니다.")

    if not self.answer or not self.answer.strip():
      raise ValidationError("답변 내용이 비어있습니다.")

  def _get_anchor(self) -> InterviewTurn:
    """현재 턴의 앵커 질문을 반환한다."""
    if self.interview_turn.turn_type == InterviewExchangeType.INITIAL:
      return self.interview_turn
    if self.interview_turn.anchor_turn is not None:
      return self.interview_turn.anchor_turn
    raise ValidationError("꼬리질문의 앵커 질문을 찾을 수 없습니다.")

  def _complete_anchor_chain(self, anchor: InterviewTurn) -> FollowupResult:
    """앵커 체인 소진 처리: 답변 저장 후 다음 앵커 반환 또는 면접 종료."""
    self.interview_turn.answer = self.answer.strip()
    self.interview_turn.save(update_fields=["answer", "updated_at"])

    # 아직 시작되지 않은 다음 앵커 = 답변이 없고 꼬리질문도 없는 INITIAL 턴
    next_anchor = (
      InterviewTurn.objects.filter(
        interview_session=self.interview_session,
        turn_type=InterviewExchangeType.INITIAL,
        answer="",
      ).exclude(pk=anchor.pk).order_by("turn_number").first()
    )

    if next_anchor:
      return FollowupResult(turns=[next_anchor], followup_exhausted=False)

    return FollowupResult(turns=[], followup_exhausted=True)

  def _call_llm(self) -> tuple[FollowUpGeneratorOutput, TokenUsageCallback]:
    resume_content = get_resume_content(self.interview_session.resume)
    job_description_content = get_job_description_content(self.interview_session.user_job_description)

    history = self._build_history(self.interview_session, self.interview_turn)

    input_data = FollowUpGeneratorInput(
      original_question=self.interview_turn.question,
      user_answer=self.answer.strip(),
      resume_content=resume_content,
      job_description_content=job_description_content,
      max_followup_questions_count=1,
      current_depth=self.interview_session.total_followup_questions + 1,
      interview_difficulty_level=self.interview_session.interview_difficulty_level,
      history=history,
    )

    callback = TokenUsageCallback()
    output = FollowUpQuestionGenerator().generate(input_data, callback=callback)
    return output, callback

  def execute(self, anchor: InterviewTurn) -> FollowupResult:
    output: FollowUpGeneratorOutput = self._llm_output
    callback: TokenUsageCallback = self._callback

    self.interview_turn.answer = self.answer.strip()
    self.interview_turn.save(update_fields=["answer", "updated_at"])

    # 다음 turn_number = 현재 세션의 최대 turn_number + 1
    max_turn = (
      InterviewTurn.objects.filter(interview_session=self.interview_session).aggregate(Max("turn_number")
                                                                                       )["turn_number__max"] or 0
    )

    followup_turns = [
      InterviewTurn(
        interview_session=self.interview_session,
        turn_type=InterviewExchangeType.FOLLOWUP,
        question_source=QuestionSource.UNKNOWN,
        question=fq.question,
        turn_number=max_turn + i,
        anchor_turn=anchor,
      ) for i, fq in enumerate(output.followup_questions, start=1)
    ]
    InterviewTurn.objects.bulk_create(followup_turns)

    self.interview_session.total_followup_questions += len(followup_turns)
    self.interview_session.save(update_fields=["total_followup_questions", "updated_at"])

    usage = callback.get_usage()
    model_name = getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")

    TokenUsage.log(
      obj=self.interview_session,
      operation=TokenOperation.COMPLETION,
      context=TokenUsageContext.INTERVIEW_FOLLOWUP,
      model_name=model_name,
      input_tokens=usage.input_tokens,
      output_tokens=usage.output_tokens,
      cost_usd=calculate_cost(usage.input_tokens, usage.output_tokens, model_name),
    )

    return FollowupResult(turns=followup_turns, followup_exhausted=False)

  def _build_history(self, interview_session: InterviewSession, current_turn: InterviewTurn) -> list[dict]:
    """현재 턴 이전의 질문·답변 이력을 반환한다."""
    return list(
      InterviewTurn.objects.filter(interview_session=interview_session
                                   ).exclude(pk=current_turn.pk).order_by("turn_number").values("question", "answer")
    )
