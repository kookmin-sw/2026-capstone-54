"""RAG 파이프라인 설정 모델."""

from pydantic import BaseModel, Field


class PipelineConfig(BaseModel):
  """RAG 파이프라인 설정."""

  chunk_size: int = Field(default=500, ge=100, le=5000, description="청크 크기 (문자 수)")
  chunk_overlap: int = Field(default=50, ge=0, le=500, description="청크 오버랩 크기 (문자 수)")
  num_questions: int = Field(default=5, ge=1, le=20, description="생성할 질문 수")
  use_bedrock: bool = Field(default=False, description="Bedrock 사용 여부 (False면 로컬 대체)")
  use_openai: bool = Field(default=False, description="OpenAI 사용 여부 (True면 GPT 사용)")
  openai_model: str = Field(default="gpt-4o-mini", description="OpenAI 모델명")


class FollowUpConfig(BaseModel):
  """꼬리질문 생성 설정."""

  num_followups: int = Field(default=3, ge=1, le=10, description="생성할 꼬리질문 개수")
  max_depth: int = Field(default=3, ge=1, le=10, description="꼬리질문 연쇄 최대 깊이")
  use_bedrock: bool = Field(default=False, description="Bedrock 사용 여부")
  use_openai: bool = Field(default=False, description="OpenAI 사용 여부")
  openai_model: str = Field(default="gpt-4o-mini", description="OpenAI 모델명")
