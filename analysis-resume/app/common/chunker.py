"""
LangChain RecursiveCharacterTextSplitter 기반 청킹.

이력서 특성에 맞게 분할 우선순위를 조정합니다:
  \n\n → 섹션 구분 (경력 / 학력 / 기술)
  \n   → 항목 구분 (각 경력, 프로젝트)
  . / 。 → 문장 경계
  ,    → 나열 항목 (기술 스택 등)
  " "  → 단어 경계
"""

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app import config

RESUME_SEPARATORS = ["\n\n", "\n", ". ", "。", ", ", " ", ""]


def chunk_text(
  text: str,
  chunk_size: int = config.CHUNK_SIZE,
  overlap: int = config.CHUNK_OVERLAP,
) -> list[str]:
  """임베딩용 청킹. 문장/단락 경계를 존중합니다."""
  splitter = RecursiveCharacterTextSplitter(
    chunk_size=chunk_size,
    chunk_overlap=overlap,
    separators=RESUME_SEPARATORS,
    length_function=len,
  )
  return splitter.split_text(text)


def chunk_text_for_llm(
  text: str,
  chunk_size: int = config.LLM_MAX_TEXT_CHARS,
) -> list[str]:
  """LLM 분석용 청킹. overlap 없이 큰 단위로 분할합니다."""
  splitter = RecursiveCharacterTextSplitter(
    chunk_size=chunk_size,
    chunk_overlap=0,
    separators=RESUME_SEPARATORS,
    length_function=len,
  )
  return splitter.split_text(text)
