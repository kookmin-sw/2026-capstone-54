"""면접 초기 질문 생성 서비스.

세션 타입에 따라 적절한 질문 생성기를 선택하고,
생성된 질문을 InterviewTurn으로 저장하며 토큰 사용량을 기록한다.

LLM 호출은 트랜잭션 외부에서 수행하여 DB 커넥션 점유 시간을 최소화한다.
"""

from __future__ import annotations

import logging

from common.exceptions import ValidationException
from common.services.base_service import BaseService
from django.conf import settings
from django.db import transaction
from interviews.enums import InterviewExchangeType, InterviewSessionStatus, InterviewSessionType, QuestionSource
from interviews.models import InterviewSession, InterviewTurn
from interviews.schemas import QuestionGeneratorInput, QuestionGeneratorOutput
from interviews.services.content_service import get_job_description_content, get_resume_content
from interviews.services.llm import (
  FollowupInterviewQuestionGenerator,
  FullProcessInterviewQuestionGenerator,
  TokenUsageCallback,
  calculate_cost,
)
from llm_trackers.enums import TokenOperation, TokenUsageContext
from llm_trackers.models import TokenUsage

logger = logging.getLogger(__name__)

_SOURCE_MAP = {
  "resume": QuestionSource.RESUME,
  "job_description": QuestionSource.JOB_DESCRIPTION,
}


class GenerateInitialQuestionsService(BaseService):
  """초기 질문 생성 서비스.

  LLM 호출을 트랜잭션 밖에서 수행하고,
  결과를 DB에 저장하는 execute()만 트랜잭션 안에서 실행한다.
  """

  required_value_kwargs = ["interview_session"]

  def perform(self) -> list[InterviewTurn]:
    self._validate_kwargs()
    self._build_kwargs()
    self.validate()

    self._llm_output, self._callback = self._call_llm()

    with transaction.atomic():
      return self.execute()

  def validate(self):
    if self.interview_session.session_status != InterviewSessionStatus.IN_PROGRESS:
      raise ValidationException("진행 중인 세션에서만 질문을 생성할 수 있습니다.")

    if self.interview_session.total_questions > 0:
      raise ValidationException("이미 초기 질문이 생성된 세션입니다.")

  def _build_kwargs(self):
    self.interview_session: InterviewSession = self.kwargs["interview_session"]

  def _call_llm(self) -> tuple[QuestionGeneratorOutput, TokenUsageCallback]:
    resume_content = get_resume_content(self.interview_session.resume)
    job_description_content = get_job_description_content(self.interview_session.user_job_description)

    input_data = QuestionGeneratorInput(
      resume_content=resume_content,
      job_description_content=job_description_content,
      question_difficulty_level=self.interview_session.interview_difficulty_level,
    )
    callback = TokenUsageCallback()

    generator = (
      FollowupInterviewQuestionGenerator() if self.interview_session.interview_session_type
      == InterviewSessionType.FOLLOWUP else FullProcessInterviewQuestionGenerator()
    )

    output = generator.generate(input_data, callback=callback)

    return output, callback

  def execute(self) -> list[InterviewTurn]:
    output: QuestionGeneratorOutput = self._llm_output
    callback: TokenUsageCallback = self._callback

    turns = [
      InterviewTurn(
        session=self.interview_session,
        turn_type=InterviewExchangeType.INITIAL,
        question_source=_SOURCE_MAP.get(q.source, QuestionSource.UNKNOWN),
        question=q.question,
        turn_number=i,
      ) for i, q in enumerate(output.questions, start=1)
    ]
    InterviewTurn.objects.bulk_create(turns)

    self.interview_session.total_questions = len(turns)
    self.interview_session.save(update_fields=["total_questions", "updated_at"])

    usage = callback.get_usage()
    model_name = getattr(settings, "OPENAI_MODEL", "gpt-4o-mini")

    TokenUsage.log(
      obj=self.interview_session,
      operation=TokenOperation.COMPLETION,
      context=TokenUsageContext.INTERVIEW_QUESTION,
      model_name=model_name,
      input_tokens=usage.input_tokens,
      output_tokens=usage.output_tokens,
      cost_usd=calculate_cost(usage.input_tokens, usage.output_tokens, model_name),
    )

    return InterviewTurn.objects.filter(interview_session=self.interview_session).order_by("turn_number")
