"""면접 초기 질문 생성기 기본 클래스.

이력서 전문과 채용공고 전문을 LLM Structured Output으로 직접 주입하여 질문을 생성한다.
청킹·벡터 검색은 사용하지 않는다.
"""

from __future__ import annotations

import logging
from typing import Literal

from common.llm_client import get_llm
from interviews.schemas import InterviewQuestion, QuestionGeneratorInput, QuestionGeneratorOutput
from pydantic import BaseModel

from .token_tracker import TokenUsageCallback

logger = logging.getLogger(__name__)


class _QuestionItem(BaseModel):
  question: str
  source: Literal["resume", "job_description", "unknown"] = "unknown"


class _QuestionsOutputSchema(BaseModel):
  questions: list[_QuestionItem]


class QuestionGenerator:
  """이력서·채용공고 기반 면접 초기 질문 생성 기본 클래스.

  서브클래스는 _get_system_prompt()와 _get_questions_count()를 구현한다.
  """

  def generate(
    self,
    input_data: QuestionGeneratorInput,
    callback: TokenUsageCallback | None = None,
  ) -> QuestionGeneratorOutput:
    llm = get_llm()
    if callback:
      llm = llm.with_config(callbacks=[callback])

    structured_llm = llm.with_structured_output(_QuestionsOutputSchema)

    system_prompt = self._get_system_prompt(input_data.difficulty_level)
    questions_count = self._get_questions_count(input_data)
    prompt = self._build_prompt(system_prompt, input_data, questions_count)

    try:
      result: _QuestionsOutputSchema = structured_llm.invoke(prompt)
    except Exception as e:
      raise RuntimeError(f"LLM 호출 실패: {e}") from e

    questions = [InterviewQuestion(question=item.question, source=item.source) for item in result.questions]
    return QuestionGeneratorOutput(questions=questions)

  def _get_system_prompt(self, difficulty_level: str) -> str:
    raise NotImplementedError

  def _get_questions_count(self, input_data: QuestionGeneratorInput) -> int:
    return input_data.questions_count

  def _build_prompt(
    self,
    system_prompt: str,
    input_data: QuestionGeneratorInput,
    questions_count: int,
  ) -> str:
    return (
      f"{system_prompt}\n\n"
      "다음은 이력서 전문입니다:\n\n"
      f"{input_data.resume_content}\n\n"
      "다음은 채용공고 정보(JSON)입니다:\n\n"
      f"{input_data.job_description_content}\n\n"
      f"위 내용을 바탕으로 면접 질문을 정확히 {questions_count}개 생성해주세요.\n"
      '"source" 값은 resume, job_description, unknown 중 하나로 명시하세요.'
    )
