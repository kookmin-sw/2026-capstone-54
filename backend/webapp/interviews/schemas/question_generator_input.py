"""QuestionGeneratorInput Pydantic 스키마."""

from __future__ import annotations

from interviews.schemas.chunk_item import ChunkItem
from pydantic import BaseModel, Field


class QuestionGeneratorInput(BaseModel):
  chunks: list[ChunkItem] = Field(default_factory=list, description="선택된 청크 목록")
  questions_count: int = Field(default=1, ge=1, le=20)
  question_difficulty_level: str = Field(default="normal")
