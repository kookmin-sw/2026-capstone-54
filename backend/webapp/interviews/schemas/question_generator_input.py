"""QuestionGeneratorInput Pydantic 스키마."""

from pydantic import BaseModel, Field


class QuestionGeneratorInput(BaseModel):
  resume_content: str = Field(..., description="이력서 전문 텍스트")
  job_description_content: str = Field(..., description="채용공고 JSON 문자열")
  num_questions: int = Field(default=1, ge=1, le=20)
  difficulty_level: str = Field(default="normal")
