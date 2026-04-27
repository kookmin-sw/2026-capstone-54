"""인터뷰 세션 heartbeat 기록 서비스."""

from common.exceptions import ConflictException
from common.services import BaseService
from django.utils import timezone
from interviews.models import InterviewSession


class RecordInterviewHeartbeatService(BaseService):
  """현재 시각으로 last_heartbeat_at 을 갱신한다."""

  required_value_kwargs = ["session"]

  def validate(self):
    session = self.kwargs["session"]
    if self.user is None or session.user_id != self.user.pk:
      raise ConflictException(
        error_code="SESSION_OWNER_REQUIRED",
        detail="세션 소유자만 heartbeat 를 송신할 수 있습니다.",
      )

  def execute(self) -> InterviewSession:
    session = self.kwargs["session"]
    session.last_heartbeat_at = timezone.now()
    session.save(update_fields=["last_heartbeat_at"])
    return session
