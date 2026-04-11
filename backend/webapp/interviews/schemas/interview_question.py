"""InterviewQuestion Pydantic 스키마."""

from pydantic import BaseModel, Field


class InterviewQuestion(BaseModel):
  question: str = Field(..., description="면접 질문 텍스트")
  source: str = Field(
    default="unknown",
    description="질문 출처 (resume | job_description | unknown)",
  )
