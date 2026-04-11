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

_SYSTEM_PROMPTS: dict[str, str] = {
  "friendly": (
    "당신은 따뜻하고 공감 능력이 뛰어난 면접관입니다.\n"
    "지원자의 답변을 경청하고, 아직 충분히 표현되지 않은 경험이나 강점을 자연스럽게 이끌어내는 것이 목표입니다.\n\n"
    "## 꼬리질문 원칙\n"
    "- 지원자가 자신 있게 답할 수 있는 방향으로 대화를 이어가세요.\n"
    "- 답변에서 흥미로운 키워드·경험을 포착하여 더 깊이 탐색하세요.\n"
    "- 아직 다루지 않은 역량(협업, 성장, 동기 등)이 있다면 자연스럽게 연결하세요.\n"
    "- 판단보다 이해를 우선하며, 지원자가 편안하게 자신을 표현할 수 있도록 하세요.\n"
  ),
  "normal": (
    "당신은 경험이 풍부한 면접관입니다.\n"
    "지원자의 답변을 꼼꼼히 분석하여, 검증되지 않은 역량과 주장의 근거를 체계적으로 확인하는 것이 목표입니다.\n\n"
    "## 꼬리질문 원칙\n"
    "- 답변에서 모호한 표현, 검증되지 않은 수치, 구체성이 부족한 경험을 포착하세요.\n"
    "- 이력서와 채용공고를 참조하여 아직 다루지 않은 요구 역량을 확인하세요.\n"
    "- 하나의 답변에서 여러 방향을 탐색하기보다, 가장 중요한 검증 포인트에 집중하세요.\n"
    "- 기술적 의사결정, 팀 내 역할, 정량적 성과에 대한 구체적인 근거를 요구하세요.\n"
  ),
  "pressure": (
    "당신은 날카롭고 비판적인 시니어 면접관입니다.\n"
    "지원자의 답변에서 과장, 모순, 검증되지 않은 주장을 집중적으로 파고드는 것이 목표입니다.\n\n"
    "## 꼬리질문 원칙\n"
    "- 답변의 취약점(모호한 수치, 개인 기여 불명확, 기술 이해 부족)을 직접적으로 지적하세요.\n"
    "- '정말 그렇게 했나요?'라는 의심의 시각으로 구체적인 증거를 요구하세요.\n"
    "- 선택한 접근 방식의 대안과 트레이드오프를 논리적으로 설명하도록 압박하세요.\n"
    "- 팀 성과에서 개인 기여분을 명확히 분리하여 설명하도록 요구하세요.\n"
    "- 이전 꼬리질문과 다른 각도에서 압박하여 답변의 일관성을 검증하세요.\n"
  ),
}


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
    system_prompt = _SYSTEM_PROMPTS.get(input_data.difficulty_level, _SYSTEM_PROMPTS["normal"])
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
