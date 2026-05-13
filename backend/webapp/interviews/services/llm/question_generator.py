"""면접 초기 질문 생성기 기본 클래스.

선택된 청크 목록을 [출처 - 유형] 라벨과 함께 LLM Structured Output으로 주입하여 질문을 생성한다.
"""

from __future__ import annotations

import logging
from typing import Literal

from common.llm_client import get_llm
from interviews.schemas import InterviewQuestion, QuestionGeneratorInput, QuestionGeneratorOutput
from langchain_core.messages import HumanMessage, SystemMessage
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

    system_prompt = self._get_system_prompt(input_data)
    questions_count = self._get_questions_count(input_data)
    messages = self._build_messages(system_prompt, input_data, questions_count)

    try:
      result: _QuestionsOutputSchema = structured_llm.invoke(messages)
    except Exception as e:
      raise RuntimeError(f"LLM 호출 실패: {e}") from e

    questions = [InterviewQuestion(question=item.question, source=item.source) for item in result.questions]
    return QuestionGeneratorOutput(questions=questions)

  def _get_system_prompt(self, input_data: QuestionGeneratorInput) -> str:
    raise NotImplementedError

  def _get_questions_count(self, input_data: QuestionGeneratorInput) -> int:
    return input_data.questions_count

  def _build_messages(
    self,
    system_prompt: str,
    input_data: QuestionGeneratorInput,
    questions_count: int,
  ) -> list[SystemMessage | HumanMessage]:
    """system/user 역할을 분리한 메시지 리스트를 생성한다."""
    # User message: 참고 자료 + 지시사항
    parts: list[str] = ["다음은 면접 질문 생성에 참고할 정보입니다:\n\n"]

    if input_data.jd_chunks:
      parts.append("## 채용공고 정보\n")
      for chunk in input_data.jd_chunks:
        parts.append(f"{chunk.format_for_prompt()}\n\n")

    if input_data.resume_chunks:
      parts.append("## 이력서 정보\n")
      for chunk in input_data.resume_chunks:
        parts.append(f"{chunk.format_for_prompt()}\n\n")

    parts.append(
      f"위 내용을 바탕으로 면접 질문을 정확히 {questions_count}개 생성해주세요.\n"
      '"source" 값은 resume, job_description, unknown 중 하나로 명시하세요.'
    )

    return [
      SystemMessage(content=system_prompt),
      HumanMessage(content="".join(parts)),
    ]
