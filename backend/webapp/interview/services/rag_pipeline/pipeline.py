"""RAG 면접 질문 생성 파이프라인 통합 모듈."""

import logging

from interview.services.rag_pipeline.chunker import Chunker
from interview.services.rag_pipeline.config import PipelineConfig
from interview.services.rag_pipeline.embeddings import EmbeddingEngine
from interview.services.rag_pipeline.exceptions import PipelineStepError
from interview.services.rag_pipeline.followup_generator import FollowUpGenerator
from interview.services.rag_pipeline.loader import DocumentLoader
from interview.services.rag_pipeline.models import (
  FollowUpInput,
  FollowUpOutput,
  InterviewQuestion,
  PipelineInput,
  PipelineOutput,
  StepUsage,
  TokenUsageStats,
)
from interview.services.rag_pipeline.question_generator import QuestionGenerator
from interview.services.rag_pipeline.retriever import KeywordRetriever
from interview.services.rag_pipeline.token_tracker import TokenUsageCallback
from interview.services.rag_pipeline.vector_store import VectorStoreManager


class RAGPipeline:

  def __init__(self, config: PipelineConfig | None = None):
    self.config = config or PipelineConfig()
    self.logger = logging.getLogger(__name__)
    self._token_callback = TokenUsageCallback()
    self._init_modules()

  def _init_modules(self) -> None:
    self.loader = DocumentLoader()
    self.chunker = Chunker(chunk_size=self.config.chunk_size, chunk_overlap=self.config.chunk_overlap)
    self.embedding_engine = EmbeddingEngine(use_bedrock=self.config.use_bedrock, use_openai=self.config.use_openai)
    self.vector_store_manager = VectorStoreManager(
      embeddings=self.embedding_engine.get_embeddings(), store_type=self.config.vector_store_type
    )
    self.retriever = KeywordRetriever(vector_store_manager=self.vector_store_manager, top_k=self.config.top_k)
    self.question_generator = QuestionGenerator(
      use_bedrock=self.config.use_bedrock, use_openai=self.config.use_openai, openai_model=self.config.openai_model
    )
    self._last_retrieved_chunks = []
    self.followup_generator = FollowUpGenerator(
      use_bedrock=self.config.use_bedrock, use_openai=self.config.use_openai, openai_model=self.config.openai_model
    )

  def run(self, input_data: PipelineInput) -> PipelineOutput:
    try:
      documents = self.loader.load_multiple(input_data.file_paths)
    except Exception as e:
      raise PipelineStepError("Document_Loader", e) from e
    try:
      chunks = self.chunker.split_multiple(documents)
    except Exception as e:
      raise PipelineStepError("Chunker", e) from e
    try:
      self.vector_store_manager.build_from_documents(chunks)
    except Exception as e:
      raise PipelineStepError("Vector_Store", e) from e
    try:
      retrieved_chunks = self.retriever.retrieve_multiple(input_data.keywords)
      self._last_retrieved_chunks = [chunk.page_content for chunk in retrieved_chunks]
    except Exception as e:
      raise PipelineStepError("Retriever", e) from e
    try:
      self._token_callback.reset()
      raw_questions = self.question_generator.generate(
        retrieved_chunks,
        input_data.keywords,
        self.config.num_questions,
        config={"callbacks": [self._token_callback]},
      )
      question_step = StepUsage(step_name="question_generation", usage=self._token_callback.get_usage())
      questions = [
        InterviewQuestion(question=q.get("question", ""), source=q.get("source", ""), keyword=q.get("keyword", ""))
        for q in raw_questions
      ]
    except Exception as e:
      raise PipelineStepError("Question_Generator", e) from e
    step_usages = [question_step]
    total_usage = self._sum_usages(step_usages)
    return PipelineOutput(
      questions=questions,
      total_chunks_retrieved=len(retrieved_chunks),
      keywords_used=input_data.keywords,
      token_usage=total_usage if total_usage.call_count > 0 else None,
      step_usages=step_usages if total_usage.call_count > 0 else None,
    )

  def generate_followups(
    self,
    original_question: str,
    user_answer: str,
    context_chunks: list[str] | None = None,
    num_followups: int = 3,
    history: list[dict] | None = None,
    anchor_question: str | None = None
  ) -> FollowUpOutput:
    try:
      if context_chunks is None and self._last_retrieved_chunks:
        context_chunks = self._last_retrieved_chunks
      input_data = FollowUpInput(
        original_question=original_question,
        user_answer=user_answer,
        context_chunks=context_chunks,
        num_followups=num_followups
      )
      self._token_callback.reset()
      output = self.followup_generator.generate_from_input(
        input_data,
        config={"callbacks": [self._token_callback]},
        history=history,
        anchor_question=anchor_question,
      )
      usage = self._token_callback.get_usage()
      output.token_usage = usage if usage.call_count > 0 else None
      return output
    except Exception as e:
      raise PipelineStepError("FollowUp_Generator", e) from e

  @staticmethod
  def _sum_usages(step_usages: list[StepUsage]) -> TokenUsageStats:
    return TokenUsageStats(
      input_tokens=sum(s.usage.input_tokens for s in step_usages),
      output_tokens=sum(s.usage.output_tokens for s in step_usages),
      total_tokens=sum(s.usage.total_tokens for s in step_usages),
      call_count=sum(s.usage.call_count for s in step_usages),
    )
