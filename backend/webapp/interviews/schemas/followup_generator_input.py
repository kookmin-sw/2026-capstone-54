"""FollowUpGeneratorInput Pydantic 스키마."""

from pydantic import BaseModel, Field


class FollowUpGeneratorInput(BaseModel):
  original_question: str = Field(..., min_length=1, description="직전 면접 질문")
  user_answer: str = Field(..., min_length=1, description="지원자 답변")
  resume_content: str = Field(..., description="이력서 전문 텍스트")
  job_description_content: str = Field(..., description="채용공고 JSON 문자열")
  max_followup_questions_count: int = Field(default=1, ge=1, le=5)
  current_depth: int = Field(default=1, ge=1)
  difficulty_level: str = Field(default="normal")
  history: list[dict] = Field(default_factory=list, description="이전 질문·답변 이력 [{question, answer}]")
