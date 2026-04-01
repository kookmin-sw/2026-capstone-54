"""RAG 파이프라인을 Django에서 사용하기 위한 서비스 레이어."""

import logging
import os

from interview.models import InterviewSession
from interview.services.exceptions import PipelineAPIError
from interview.services.rag_pipeline.config import PipelineConfig
from interview.services.rag_pipeline.exceptions import PipelineStepError
from interview.services.rag_pipeline.models import (
  FollowUpInput,
  FollowUpOutput,
  InterviewQuestion,
  PipelineInput,
  PipelineOutput,
  StepUsage,
)
from interview.services.rag_pipeline.pipeline import RAGPipeline
from interview.services.rag_pipeline.prompt_registry import PromptRegistry

logger = logging.getLogger(__name__)


class InterviewService:
  """RAG 파이프라인을 Django에서 사용하기 위한 서비스 레이어."""

  def __init__(self, config: PipelineConfig | None = None):
    self._config = config or PipelineConfig(
      use_openai=bool(os.getenv("OPENAI_API_KEY")),
      openai_model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    )
    self._pipeline = RAGPipeline(config=self._config)
    self._prompt_registry = PromptRegistry()

  def generate_questions(
    self,
    file_paths: list[str],
    keywords: list[str],
    difficulty_level: str = "normal",
  ) -> PipelineOutput:
    """난이도별 프롬프트를 적용하여 면접 질문 생성."""
    prompt = self._prompt_registry.get_question_prompt(difficulty_level)
    try:
      input_data = PipelineInput(file_paths=file_paths, keywords=keywords)
      documents = self._pipeline.loader.load_multiple(input_data.file_paths)
      chunks = self._pipeline.chunker.split_multiple(documents)
      self._pipeline.vector_store_manager.build_from_documents(chunks)
      retrieved_chunks = self._pipeline.retriever.retrieve_multiple(input_data.keywords)
      self._pipeline._last_retrieved_chunks = [chunk.page_content for chunk in retrieved_chunks]

      self._pipeline._token_callback.reset()
      raw_questions = self._pipeline.question_generator.generate(
        retrieved_chunks,
        input_data.keywords,
        self._config.num_questions,
        config={"callbacks": [self._pipeline._token_callback]},
        system_prompt_override=prompt,
      )
      question_step = StepUsage(step_name="question_generation", usage=self._pipeline._token_callback.get_usage())
      questions = [
        InterviewQuestion(question=q.get("question", ""), source=q.get("source", ""), keyword=q.get("keyword", ""))
        for q in raw_questions
      ]
      step_usages = [question_step]
      total_usage = RAGPipeline._sum_usages(step_usages)
      return PipelineOutput(
        questions=questions,
        total_chunks_retrieved=len(retrieved_chunks),
        keywords_used=input_data.keywords,
        token_usage=total_usage if total_usage.call_count > 0 else None,
        step_usages=step_usages if total_usage.call_count > 0 else None,
      )
    except PipelineStepError as e:
      raise PipelineAPIError(e) from e

  def generate_followups(
    self,
    session_id: int,
    original_question: str,
    user_answer: str,
    context_chunks: list[str] | None = None,
    num_followups: int = 3,
    history: list[dict] | None = None,
    anchor_question: str | None = None,
  ) -> FollowUpOutput:
    """세션의 난이도를 조회하여 꼬리질문 생성."""
    session = InterviewSession.objects.get(id=session_id)
    prompt = self._prompt_registry.get_followup_prompt(session.difficulty_level)
    try:
      if context_chunks is None and self._pipeline._last_retrieved_chunks:
        context_chunks = self._pipeline._last_retrieved_chunks
      input_data = FollowUpInput(
        original_question=original_question,
        user_answer=user_answer,
        context_chunks=context_chunks,
        num_followups=num_followups,
      )
      self._pipeline._token_callback.reset()
      output = self._pipeline.followup_generator.generate_from_input(
        input_data,
        config={"callbacks": [self._pipeline._token_callback]},
        history=history,
        anchor_question=anchor_question,
        system_prompt_override=prompt,
      )
      usage = self._pipeline._token_callback.get_usage()
      output.token_usage = usage if usage.call_count > 0 else None
      return output
    except PipelineStepError as e:
      raise PipelineAPIError(e) from e
