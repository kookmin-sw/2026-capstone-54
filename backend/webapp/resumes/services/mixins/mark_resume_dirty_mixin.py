"""섹션 수정 서비스 공통 mixin.

서비스 실행이 끝나면 관련 Resume 의 `is_dirty=True` 로 설정해 사용자가 '최종 저장' 을
누르기 전까지 재임베딩 필요 상태를 유지한다.
"""

from resumes.models import Resume


class MarkResumeDirtyMixin:
  """섹션 서비스가 상속. `self.kwargs["resume"]` 을 읽어 mark_dirty() 를 호출한다."""

  def _mark_dirty(self) -> None:
    resume = self.kwargs.get("resume")
    if isinstance(resume, Resume):
      resume.mark_dirty()
