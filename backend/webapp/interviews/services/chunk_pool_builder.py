"""ChunkPoolBuilder 서비스.

ResumeEmbedding 테이블과 JobDescription 모델에서 청크를 수집하여
청크 풀을 구성한다. TEXT, SUMMARY 유형은 제외한다
"""

from __future__ import annotations

import logging

from interviews.schemas.chunk_item import ChunkItem
from resumes.enums import ChunkType
from resumes.models import ResumeEmbedding

logger = logging.getLogger(__name__)

_EXCLUDED_CHUNK_TYPES = {ChunkType.TEXT, ChunkType.SUMMARY}

_JD_FIELD_LABELS: dict[str, str] = {
  "duties": "담당업무",
  "requirements": "자격요건",
  "preferred": "우대사항",
}


class ChunkPoolBuilder:
  """이력서와 채용공고에서 청크를 수집하여 청크 풀을 구성한다."""

  def build(self, resume, job_description) -> list[ChunkItem]:
    """이력서 청크와 채용공고 청크를 합쳐 하나의 청크 풀을 반환한다."""
    resume_chunks = self._build_resume_chunks(resume)
    jd_chunks = self._build_jd_chunks(job_description)
    return resume_chunks + jd_chunks

  def _build_resume_chunks(self, resume) -> list[ChunkItem]:
    """ResumeEmbedding에서 TEXT/SUMMARY를 제외한 청크를 조회한다."""
    if resume is None:
      return []
    try:
      embeddings = ResumeEmbedding.objects.filter(resume=resume, ).exclude(
        chunk_type__in=[ct.value for ct in _EXCLUDED_CHUNK_TYPES],
      )
      return [
        ChunkItem(
          source_label="이력서",
          type_label=ChunkType(emb.chunk_type).label,
          text=emb.context,
        ) for emb in embeddings if emb.context.strip()
      ]
    except Exception:
      logger.exception("이력서 청크 조회 실패")
      return []

  def _build_jd_chunks(self, job_description) -> list[ChunkItem]:
    """JobDescription의 duties/requirements/preferred에서 비어있지 않은 필드만 청크로 생성한다."""
    if job_description is None:
      return []
    try:
      chunks: list[ChunkItem] = []
      for field_name, label in _JD_FIELD_LABELS.items():
        value = getattr(job_description, field_name, "")
        if value and value.strip():
          chunks.append(ChunkItem(
            source_label="채용공고",
            type_label=label,
            text=value.strip(),
          ))
      return chunks
    except Exception:
      logger.exception("채용공고 청크 조회 실패")
      return []
