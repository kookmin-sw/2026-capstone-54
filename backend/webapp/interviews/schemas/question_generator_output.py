"""QuestionGeneratorOutput Pydantic 스키마."""

from interviews.schemas.interview_question import InterviewQuestion
from pydantic import BaseModel, Field


class QuestionGeneratorOutput(BaseModel):
  questions: list[InterviewQuestion] = Field(default_factory=list)
