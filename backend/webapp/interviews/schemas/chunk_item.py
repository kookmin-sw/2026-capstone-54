"""ChunkItem Pydantic 스키마."""

from pydantic import BaseModel, Field


class ChunkItem(BaseModel):
  source_label: str = Field(..., description="출처 라벨 (이력서 | 채용공고)")
  type_label: str = Field(..., description="유형 라벨 (경력, 스킬, 담당업무 등)")
  text: str = Field(..., description="청크 텍스트 내용")

  def format_for_prompt(self) -> str:
    """LLM 프롬프트용 포맷: [출처 - 유형]\n텍스트"""
    return f"[{self.source_label} - {self.type_label}]\n{self.text}"
