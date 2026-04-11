"""면접 턴 목록 조회 뷰."""

from api.v1.interviews.serializers import InterviewTurnSerializer
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.models import InterviewTurn
from interviews.services import get_interview_session_for_user
from rest_framework.response import Response


@extend_schema(tags=["면접"])
class InterviewTurnListView(BaseAPIView):

  @extend_schema(summary="면접 턴 목록 조회")
  def get(self, request, interview_session_uuid):
    interview_session = get_interview_session_for_user(interview_session_uuid, self.current_user)
    interview_turns = InterviewTurn.objects.filter(interview_session=interview_session).order_by("turn_number")
    return Response(InterviewTurnSerializer(interview_turns, many=True).data)
