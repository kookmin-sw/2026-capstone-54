"""QuestionGeneratorInput Pydantic 스키마."""

from __future__ import annotations

from interviews.schemas.chunk_item import ChunkItem
from pydantic import BaseModel, Field


class QuestionGeneratorInput(BaseModel):
  resume_chunks: list[ChunkItem] = Field(default_factory=list, description="이력서 청크 목록")
  jd_chunks: list[ChunkItem] = Field(default_factory=list, description="채용공고 청크 목록")
  questions_count: int = Field(default=1, ge=1, le=20)
  question_difficulty_level: str = Field(default="normal")
  company_name: str = Field(default="", description="채용공고 회사명")
  job_title: str = Field(default="", description="채용공고 제목")
