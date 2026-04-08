"""FollowUpGeneratorOutput Pydantic 스키마."""

from interviews.schemas.followup_question import FollowUpQuestion
from pydantic import BaseModel, Field


class FollowUpGeneratorOutput(BaseModel):
  followup_questions: list[FollowUpQuestion] = Field(default_factory=list)
  original_question: str = Field(...)
  user_answer: str = Field(...)
