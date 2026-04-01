"""꼬리질문 생성 모듈."""

import json
import logging

from interview.services.rag_pipeline.models import FollowUpInput, FollowUpOutput, FollowUpQuestion
from langchain_core.language_models import BaseLLM
from langchain_core.messages import BaseMessage


class FollowUpGenerator:

  def __init__(
    self,
    llm: BaseLLM | None = None,
    use_bedrock: bool = False,
    use_openai: bool = False,
    openai_model: str = "gpt-4o-mini"
  ):
    self.llm = llm or self._create_default(use_bedrock, use_openai, openai_model)
    self.logger = logging.getLogger(__name__)

  def _create_default(self, use_bedrock: bool, use_openai: bool, openai_model: str) -> BaseLLM:
    if use_openai:
      from langchain_openai import ChatOpenAI
      return ChatOpenAI(model=openai_model, temperature=0.7)
    if use_bedrock:
      try:
        from langchain_aws import ChatBedrock
        return ChatBedrock(model_id="anthropic.claude-3-haiku-20240307-v1:0")
      except Exception as e:
        raise ConnectionError(f"Bedrock LLM 연결 실패: {e}") from e
    from langchain_community.llms.fake import FakeListLLM
    default_response = json.dumps(
      [
        {
          "question": "그 기술적 도전을 해결하기 위해 어떤 접근 방식을 시도했나요?",
          "rationale": "해결 과정을 파악하기 위함"
        },
        {
          "question": "해당 경험에서 팀원들과의 협업은 어떻게 이루어졌나요?",
          "rationale": "팀 협업 능력 검증"
        },
        {
          "question": "만약 다시 같은 상황이 온다면 다르게 접근할 부분이 있나요?",
          "rationale": "자기 성찰 능력 확인"
        },
      ],
      ensure_ascii=False
    )
    return FakeListLLM(responses=[default_response])

  def _build_prompt(
    self,
    original_question: str,
    user_answer: str,
    context_chunks: list[str] | None,
    num_followups: int,
    history: list[dict] | None = None,
    anchor_question: str | None = None,
    system_prompt_override: str | None = None
  ) -> str:
    if system_prompt_override is not None:
      persona = system_prompt_override
    else:
      persona = ("당신은 채용 면접을 진행하는 시니어 면접관입니다.\n"
                 "당신의 목표는 '이 지원자가 우리가 요구하는 역량을 실제로 보유하고 있는가'를 검증하는 것입니다.\n\n")
    dynamic_data = ""
    if anchor_question:
      dynamic_data += f"## 검증 목적 앵커\n이 꼬리질문 체인의 최초 질문: \"{anchor_question}\"\n\n"
    if history and len(history) > 1:
      dynamic_data += "## 이전 대화 흐름\n"
      for i, h in enumerate(history[:-1]):
        dynamic_data += f"Q{i + 1}: {h['question']}\nA{i + 1}: {h['answer']}\n"
      dynamic_data += "\n"
    dynamic_data += f"## 현재 질문\n{original_question}\n\n## 지원자 답변\n{user_answer}\n\n"
    if context_chunks:
      dynamic_data += "## 참고 문서\n" + "\n---\n".join(context_chunks) + "\n\n"
    dynamic_data += (
      f"위 내용을 바탕으로 꼬리질문을 정확히 {num_followups}개 생성하세요.\n"
      'JSON 배열로만 반환하며, 각 항목은 "question"과 "rationale" 필드를 포함하세요.\n'
      "JSON 배열만 반환하세요."
    )
    return f"{persona}\n\n{dynamic_data}"

  def generate(
    self,
    original_question: str,
    user_answer: str,
    context_chunks: list[str] | None = None,
    num_followups: int = 3,
    current_depth: int = 1,
    max_depth: int = 3,
    history: list[dict] | None = None,
    anchor_question: str | None = None,
    config: dict | None = None,
    system_prompt_override: str | None = None
  ) -> list[dict]:
    if current_depth > max_depth:
      return []
    prompt = self._build_prompt(
      original_question,
      user_answer,
      context_chunks,
      num_followups,
      history=history,
      anchor_question=anchor_question,
      system_prompt_override=system_prompt_override
    )
    try:
      response = self.llm.invoke(prompt, config=config or {})
    except Exception as e:
      raise RuntimeError(f"LLM 호출 실패: {e}") from e

    if isinstance(response, BaseMessage):
      raw = response.content
    elif isinstance(response, str):
      raw = response
    else:
      raw = str(response)
    raw = raw.strip()
    if raw.startswith("```"):
      lines = [line for line in raw.split("\n") if not line.strip().startswith("```")]
      raw = "\n".join(lines).strip()
    try:
      questions = json.loads(raw)
    except (json.JSONDecodeError, TypeError) as e:
      raise ValueError(f"LLM 응답 파싱 실패: {e}") from e
    if not isinstance(questions, list):
      raise ValueError("LLM 응답이 리스트가 아닙니다.")
    return [
      {
        "question": item.get("question", ""),
        "rationale": item.get("rationale", "")
      } for item in questions if isinstance(item, dict)
    ]

  def generate_from_input(
    self,
    input_data: FollowUpInput,
    config: dict | None = None,
    history: list[dict] | None = None,
    anchor_question: str | None = None,
    system_prompt_override: str | None = None
  ) -> FollowUpOutput:
    raw_questions = self.generate(
      original_question=input_data.original_question,
      user_answer=input_data.user_answer,
      context_chunks=input_data.context_chunks,
      num_followups=input_data.num_followups,
      current_depth=input_data.current_depth,
      config=config,
      history=history,
      anchor_question=anchor_question,
      system_prompt_override=system_prompt_override,
    )
    return FollowUpOutput(
      followup_questions=[FollowUpQuestion(question=q["question"], rationale=q["rationale"]) for q in raw_questions],
      original_question=input_data.original_question,
      user_answer=input_data.user_answer,
    )
