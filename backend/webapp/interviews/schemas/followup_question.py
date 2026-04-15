"""FollowUpQuestion Pydantic 스키마."""

from pydantic import BaseModel, Field


class FollowUpQuestion(BaseModel):
  question: str = Field(..., min_length=1)
  rationale: str = Field(default="")
