"""꼬리질문 생성기.

직전 질문·답변과 대화 이력을 분석하여 아직 검증되지 않은 영역을 집중적으로 파고드는
꼬리질문을 Structured Output으로 생성한다.
"""

from __future__ import annotations

import logging

from common.llm_client import get_llm
from interviews.schemas.followup_generator_input import FollowUpGeneratorInput
from interviews.schemas.followup_generator_output import FollowUpGeneratorOutput
from interviews.schemas.followup_question import FollowUpQuestion
from interviews.services.llm.prompt_registry import PromptRegistry
from interviews.services.llm.token_tracker import TokenUsageCallback
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# ── Structured Output 스키마 ─────────────────────────────────────────────────


class _FollowUpItem(BaseModel):
  question: str
  rationale: str


class _FollowUpOutputSchema(BaseModel):
  followup_questions: list[_FollowUpItem]


# ── 난이도별 프롬프트 ─────────────────────────────────────────────────────────

_registry = PromptRegistry()


class FollowUpQuestionGenerator:
  """직전 답변 기반 꼬리질문 생성기."""

  def generate(
    self,
    input_data: FollowUpGeneratorInput,
    callback: TokenUsageCallback | None = None,
  ) -> FollowUpGeneratorOutput:
    llm = get_llm()
    if callback:
      llm = llm.with_config(callbacks=[callback])

    structured_llm = llm.with_structured_output(_FollowUpOutputSchema)
    prompt = self._build_prompt(input_data)

    try:
      result: _FollowUpOutputSchema = structured_llm.invoke(prompt)
    except Exception as e:
      raise RuntimeError(f"LLM 호출 실패: {e}") from e

    questions = [
      FollowUpQuestion(question=item.question, rationale=item.rationale) for item in result.followup_questions
    ]
    return FollowUpGeneratorOutput(
      followup_questions=questions,
      original_question=input_data.original_question,
      user_answer=input_data.user_answer,
    )

  def _build_prompt(self, input_data: FollowUpGeneratorInput) -> str:
    system_prompt = _registry.get_followup_prompt(input_data.difficulty_level)
    parts: list[str] = [system_prompt, "\n"]

    # 이력서·채용공고 참조
    parts.append(
      "## 참고 자료\n"
      f"### 이력서\n{input_data.resume_content}\n\n"
      f"### 채용공고(JSON)\n{input_data.job_description_content}\n\n"
    )

    # 대화 이력 (이전 Q&A)
    if input_data.history:
      parts.append("## 지금까지의 면접 대화\n")
      for i, h in enumerate(input_data.history):
        parts.append(f"Q{i + 1}: {h.get('question', '')}\n")
        if h.get("answer"):
          parts.append(f"A{i + 1}: {h.get('answer', '')}\n")
      parts.append("\n")

    # 현재 질문·답변
    parts.append("## 현재 질문과 답변\n"
                 f"질문: {input_data.original_question}\n"
                 f"답변: {input_data.user_answer}\n\n")

    # 꼬리질문 생성 지시
    parts.append(
      f"위 답변을 바탕으로 꼬리질문 {input_data.max_followup_questions_count}개를 생성하세요.\n"
      "각 꼬리질문에는 이 질문을 선택한 이유(rationale)를 함께 작성하세요.\n"
      "이미 다룬 주제를 반복하지 말고, 아직 검증되지 않은 영역에 집중하세요."
    )

    return "".join(parts)
