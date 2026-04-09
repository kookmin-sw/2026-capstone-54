"""면접 세션 조회 뷰"""

from api.v1.interviews.serializers import InterviewSessionSerializer
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.services import get_interview_session_for_user
from rest_framework.response import Response


@extend_schema(tags=["면접"])
class InterviewSessionDetailView(BaseAPIView):
  serializer_class = InterviewSessionSerializer
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="면접 세션 조회")
  def get(self, request, interview_session_uuid):
    session = get_interview_session_for_user(interview_session_uuid, self.current_user)
    return Response(InterviewSessionSerializer(session).data)
