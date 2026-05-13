from common.services import BaseQueryService
from interviews.enums import InterviewSessionStatus
from interviews.models import InterviewSession


class TotalCompletedInterviewCountService(BaseQueryService):
  required_value_kwargs: list[str] = []

  def execute(self) -> int:
    return InterviewSession.objects.filter(
      user=self.user,
      interview_session_status=InterviewSessionStatus.COMPLETED,
    ).count()
