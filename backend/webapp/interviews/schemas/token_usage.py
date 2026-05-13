"""토큰 사용량 Pydantic 스키마."""

from pydantic import BaseModel, Field


class TokenUsageStats(BaseModel):
  input_tokens: int = Field(default=0, ge=0)
  output_tokens: int = Field(default=0, ge=0)
  total_tokens: int = Field(default=0, ge=0)
  call_count: int = Field(default=0, ge=0)
