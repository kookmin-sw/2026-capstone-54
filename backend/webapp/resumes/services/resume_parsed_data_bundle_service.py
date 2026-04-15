"""Resume 의 정규화 sub-model 들을 downstream 태스크 입력용 JSON dict 로 조립한다.

`ResumeParsedDataReader` 와 차이:
- Reader: serializer 의 `parsed_data` 필드 응답용 (UI 노출 최소 정보)
- Bundle: 면접/리포트 생성 등 downstream worker 의 입력용. Resume 메타(title, uuid,
  source_mode, last_finalized_at) 도 포함해 한 덩어리로 자급자족 가능.
"""

from __future__ import annotations

from resumes.models import Resume
from resumes.services.resume_parsed_data_reader import ResumeParsedDataReader
from resumes.services.resume_prefetch import reload_resume_with_full_prefetch


class ResumeParsedDataBundleService:
  """단일 Resume → bundle dict (parsed + meta + raw).

  호출 측이 prefetch 안 된 Resume 인스턴스를 넘겨도 N+1 이 발생하지 않도록,
  reader 가 touch 하는 모든 1:1/1:N/N:M 관계를 내부에서 한 번에 reload 한다.
  """

  def __init__(self, resume: Resume):
    self.resume = reload_resume_with_full_prefetch(resume)

  def build_dict(self) -> dict:
    parsed = ResumeParsedDataReader(self.resume).build_dict() or self.resume.parsed_data or {}
    raw_text = self._safe_text_content()
    return {
      "resume": {
        "uuid": str(self.resume.pk),
        "title": self.resume.title,
        "type": self.resume.type,
        "source_mode": self.resume.source_mode,
        "is_dirty": self.resume.is_dirty,
        "last_finalized_at": self.resume.last_finalized_at.isoformat() if self.resume.last_finalized_at else None,
        "analyzed_at": self.resume.analyzed_at.isoformat() if self.resume.analyzed_at else None,
      },
      "parsed_data": parsed,
      "raw": {
        "text_content": raw_text,
      },
    }

  def _safe_text_content(self) -> str | None:
    """text/file 원본 텍스트가 있으면 반환. structured 는 None."""
    try:
      tc = self.resume.text_content
      return tc.content if tc else None
    except Exception:
      pass
    try:
      fc = self.resume.file_content
      return fc.content if fc else None
    except Exception:
      pass
    return None
