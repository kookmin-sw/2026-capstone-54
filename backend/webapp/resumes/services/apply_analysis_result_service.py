"""분석 결과(ParsedResumeData + 임베딩 + 토큰 사용량) 를 Django ORM 에 영속화한다.

이 서비스는 analysis-resume worker 가 보낸 Celery payload 를 수신하는 백엔드 태스크
`resumes.tasks.apply_analysis_result` 가 내부에서 호출한다.

두 가지 진입 경로:
1. 신규 분석(file/text 업로드) — parsed_data 가 dict 로 전달됨.
   → ParsedResumeData 검증 → mark_completed → Writer 로 sub-model 저장 → embeddings/file_text/token_usages 기록.
2. 재임베딩(reembed) — parsed_data=None.
   → sub-model 은 이미 저장된 상태(섹션 인라인 편집 또는 구조화 생성 시 Writer 로 저장됨).
   → embeddings 만 새로 bulk_create 하고 mark_finalized() 로 is_dirty 해제.
"""

from __future__ import annotations

from typing import Any

from common.services import BaseService
from resumes.enums import ChunkType
from resumes.models import Resume, ResumeEmbedding, ResumeFileContent, ResumeTokenUsage
from resumes.schemas.parsed_data import ParsedResumeData
from resumes.services.resume_parsed_data_writer import ResumeParsedDataWriter


class ApplyAnalysisResultService(BaseService):
  """analysis-resume 이 완료 payload 를 backend 로 넘길 때 호출되는 서비스."""

  required_value_kwargs = ["resume"]

  def execute(self):
    resume: Resume = self.kwargs["resume"]
    raw_parsed: dict[str, Any] | None = self.kwargs.get("parsed_data")
    embeddings: list[dict[str, Any]] | None = self.kwargs.get("embeddings")
    file_text_content: str | None = self.kwargs.get("file_text_content")
    token_usages: list[dict[str, Any]] | None = self.kwargs.get("token_usages")

    if raw_parsed is not None:
      # 신규 분석 경로 — parsed_data 검증 후 sub-model 까지 일괄 갱신
      parsed = ParsedResumeData.from_raw(raw_parsed)
      parsed_dict = parsed.model_dump()
      resume.mark_completed(parsed_data=parsed_dict)
      ResumeParsedDataWriter(resume=resume, parsed_data=parsed).write()
    else:
      # 재임베딩 경로 — sub-model 은 그대로, embeddings 만 교체
      resume.mark_finalized()

    # 파일 추출 텍스트 (PDF 이력서) — 신규 분석에서만 들어옴
    if file_text_content is not None and hasattr(resume, "file_content"):
      try:
        fc: ResumeFileContent = resume.file_content
        fc.content = file_text_content
        fc.save(update_fields=["content", "updated_at"])
      except ResumeFileContent.DoesNotExist:
        pass

    if embeddings:
      self._write_embeddings(resume, embeddings)

    if token_usages:
      self._write_token_usages(resume, token_usages)

    return resume

  def _write_embeddings(self, resume: Resume, items: list[dict[str, Any]]) -> None:
    # 기존 임베딩 제거 후 재삽입 (idempotent)
    ResumeEmbedding.objects.filter(resume=resume).delete()
    ResumeEmbedding.objects.bulk_create(
      [
        ResumeEmbedding(
          resume=resume,
          user=resume.user,
          embedding_vector=item.get("vector"),
          context=item.get("context", ""),
          chunk_type=item.get("chunk_type", ChunkType.TEXT),
          chunk_index=item.get("chunk_index", idx),
        ) for idx, item in enumerate(items)
      ]
    )

  def _write_token_usages(self, resume: Resume, items: list[dict[str, Any]]) -> None:
    ResumeTokenUsage.objects.bulk_create(
      [
        ResumeTokenUsage(
          user=resume.user,
          resume=resume,
          operation_type=item.get("operation_type", "analyze"),
          model_name=item.get("model_name", ""),
          prompt_tokens=item.get("prompt_tokens", 0),
          total_tokens=item.get("total_tokens", 0),
        ) for item in items
      ]
    )
