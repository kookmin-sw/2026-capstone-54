"""인터뷰 세션 일시정지 서비스."""

from common.exceptions import ConflictException
from common.services import BaseService
from interviews.enums import InterviewSessionStatus
from interviews.models import InterviewSession


class PauseInterviewSessionService(BaseService):
  """IN_PROGRESS 세션을 PAUSED 로 전환한다 (이미 PAUSED 면 idempotent)."""

  required_value_kwargs = ["session", "reason"]

  def validate(self):
    session = self.kwargs["session"]
    if self.user is None or session.user_id != self.user.pk:
      raise ConflictException(
        error_code="SESSION_OWNER_REQUIRED",
        detail="세션 소유자만 일시정지할 수 있습니다.",
      )

  def execute(self) -> InterviewSession:
    session = self.kwargs["session"]
    if session.interview_session_status == InterviewSessionStatus.PAUSED:
      return session
    if session.interview_session_status != InterviewSessionStatus.IN_PROGRESS:
      raise ConflictException(
        error_code="INTERVIEW_SESSION_NOT_IN_PROGRESS",
        detail="진행 중인 세션만 일시정지할 수 있습니다.",
      )
    session.mark_paused(reason=self.kwargs["reason"])
    return session
