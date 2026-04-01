"""RAG 파이프라인 입출력 데이터 모델."""

from pydantic import BaseModel, Field


class PipelineInput(BaseModel):
  file_paths: list[str] = Field(..., min_length=1, description="마크다운 문서 경로 리스트")
  keywords: list[str] = Field(..., min_length=1, description="검색 키워드 리스트")


class InterviewQuestion(BaseModel):
  question: str = Field(..., description="면접 질문 텍스트")
  source: str = Field(..., description="질문 근거 청크의 출처 문서 경로")
  keyword: str = Field(default="", description="질문 생성에 사용된 키워드")


class TokenUsageStats(BaseModel):
  input_tokens: int = Field(default=0, ge=0)
  output_tokens: int = Field(default=0, ge=0)
  total_tokens: int = Field(default=0, ge=0)
  call_count: int = Field(default=0, ge=0)


class StepUsage(BaseModel):
  step_name: str = Field(..., description="단계 이름")
  usage: TokenUsageStats = Field(default_factory=TokenUsageStats)


class PipelineOutput(BaseModel):
  questions: list[InterviewQuestion] = Field(default_factory=list)
  total_chunks_retrieved: int = Field(default=0)
  keywords_used: list[str] = Field(default_factory=list)
  token_usage: TokenUsageStats | None = Field(default=None)
  step_usages: list[StepUsage] | None = Field(default=None)


class FollowUpQuestion(BaseModel):
  question: str = Field(..., min_length=1)
  rationale: str = Field(default="")


class FollowUpInput(BaseModel):
  original_question: str = Field(..., min_length=1)
  user_answer: str = Field(..., min_length=1)
  context_chunks: list[str] | None = Field(default=None)
  num_followups: int = Field(default=3, ge=1, le=10)
  current_depth: int = Field(default=1, ge=1)


class FollowUpOutput(BaseModel):
  followup_questions: list[FollowUpQuestion] = Field(default_factory=list)
  original_question: str = Field(...)
  user_answer: str = Field(...)
  token_usage: TokenUsageStats | None = Field(default=None)
