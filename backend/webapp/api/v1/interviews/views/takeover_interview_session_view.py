"""인터뷰 세션 owner 강제 인수(takeover) 뷰."""

from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.services import (
  TakeoverInterviewSessionService,
  get_interview_session_for_user,
)
from rest_framework.response import Response


@extend_schema(tags=["면접"])
class TakeoverInterviewSessionView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="인터뷰 세션 owner 강제 인수")
  def post(self, request, interview_session_uuid):
    interview_session = get_interview_session_for_user(interview_session_uuid, self.current_user)
    result = TakeoverInterviewSessionService(
      user=self.current_user,
      session=interview_session,
    ).perform()
    return Response(result)
