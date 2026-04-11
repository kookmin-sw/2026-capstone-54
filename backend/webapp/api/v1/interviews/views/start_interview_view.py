"""면접 초기 질문 생성 뷰."""

from api.v1.interviews.serializers import InterviewTurnSerializer
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.services import GenerateInitialQuestionsService, get_interview_session_for_user
from rest_framework import status
from rest_framework.response import Response


@extend_schema(tags=["면접"])
class StartInterviewView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="면접 시작 — 초기 질문 생성")
  def post(self, request, interview_session_uuid):
    interview_session = get_interview_session_for_user(interview_session_uuid, self.current_user)

    interview_turns = GenerateInitialQuestionsService(interview_session=interview_session).perform()

    return Response(InterviewTurnSerializer(interview_turns, many=True).data, status=status.HTTP_201_CREATED)
