"""면접 질문 생성 모듈."""

import json
import logging

from langchain_core.documents import Document
from langchain_core.language_models import BaseLLM
from langchain_core.messages import BaseMessage


class QuestionGenerator:

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
          "question": "프로젝트에서 가장 어려웠던 기술적 도전은 무엇이었나요?",
          "source": "unknown"
        },
        {
          "question": "해당 기술을 선택한 이유는 무엇인가요?",
          "source": "unknown"
        },
        {
          "question": "팀 내에서 어떤 역할을 담당했나요?",
          "source": "unknown"
        },
      ],
      ensure_ascii=False
    )
    return FakeListLLM(responses=[default_response])

  def _build_prompt(
    self,
    chunks: list[Document],
    keywords: list[str],
    num_questions: int,
    system_prompt_override: str | None = None
  ) -> str:
    chunk_texts = "\n---\n".join(
      f"[출처: {chunk.metadata.get('source', 'unknown')}]\n{chunk.page_content}" for chunk in chunks
    )
    keyword_str = ", ".join(keywords)
    if system_prompt_override is not None:
      persona = system_prompt_override
    else:
      persona = (
        "당신은 채용공고의 포지션에 대한 채용 면접을 진행하는 실제 면접관입니다. "
        "당신의 목표는 이 지원자가 우리 회사와 팀에 정말 필요한 사람인지 판단하는 것입니다.\n\n"
        "## 면접관의 관점\n"
        "- 채용공고에 명시된 주요업무, 자격요건, 우대사항을 기준으로 지원자를 평가하세요.\n"
        "- 구체적 상황 기반 질문을 우선하세요.\n"
        "- 채용공고의 요구사항을 반드시 반영하세요.\n\n"
      )
    dynamic_data = (
      "다음은 이력서 및 채용공고에서 검색된 관련 문서 청크입니다:\n\n"
      f"{chunk_texts}\n\n"
      f"참고 키워드: {keyword_str}\n\n"
      f"위 내용을 바탕으로 면접 질문을 정확히 {num_questions}개 생성해주세요.\n"
      '각 질문은 JSON 배열 형식으로 반환하며, 각 항목은 "question"과 "source" 필드를 포함해야 합니다.\n'
      "JSON 배열만 반환하세요."
    )
    return f"{persona}\n\n{dynamic_data}"

  def generate(
    self,
    chunks: list[Document],
    keywords: list[str],
    num_questions: int = 5,
    config: dict | None = None,
    system_prompt_override: str | None = None
  ) -> list[dict]:
    prompt = self._build_prompt(chunks, keywords, num_questions, system_prompt_override)
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
      lines = raw.split("\n")
      lines = [line for line in lines if not line.strip().startswith("```")]
      raw = "\n".join(lines).strip()

    try:
      questions = json.loads(raw)
    except (json.JSONDecodeError, TypeError) as e:
      raise ValueError(f"LLM 응답 파싱 실패: {e}. 원본 응답: {raw[:500]}") from e
    if not isinstance(questions, list):
      raise ValueError(f"LLM 응답이 리스트가 아닙니다. 원본 응답: {raw[:500]}")

    sources = list({chunk.metadata.get("source", "unknown") for chunk in chunks})
    default_source = sources[0] if sources else "unknown"
    result = []
    for item in questions:
      if not isinstance(item, dict):
        continue
      question_text = item.get("question", "")
      source = item.get("source", default_source)
      if source == "unknown" and default_source != "unknown":
        source = default_source
      result.append({"question": question_text, "source": source})
    return result
