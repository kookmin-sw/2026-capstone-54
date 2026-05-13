"""인터뷰 세션 재개 서비스."""

from common.exceptions import ConflictException
from common.services import BaseService
from interviews.enums import InterviewSessionStatus
from interviews.models import InterviewSession


class ResumeInterviewSessionService(BaseService):
  """PAUSED 세션을 IN_PROGRESS 로 재개한다 (이미 IN_PROGRESS 면 idempotent)."""

  required_value_kwargs = ["session"]

  def validate(self):
    session = self.kwargs["session"]
    if self.user is None or session.user_id != self.user.pk:
      raise ConflictException(
        error_code="SESSION_OWNER_REQUIRED",
        detail="세션 소유자만 재개할 수 있습니다.",
      )

  def execute(self) -> InterviewSession:
    session = self.kwargs["session"]
    if session.interview_session_status == InterviewSessionStatus.IN_PROGRESS:
      return session
    if session.interview_session_status != InterviewSessionStatus.PAUSED:
      raise ConflictException(
        error_code="INTERVIEW_SESSION_NOT_PAUSED",
        detail="일시정지된 세션만 재개할 수 있습니다.",
      )
    session.mark_resumed()
    return session
