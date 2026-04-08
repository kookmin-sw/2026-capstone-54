"""답변 제출 뷰 — 꼬리질문 생성 또는 다음 질문 반환."""

from api.v1.interviews.serializers import InterviewTurnSerializer, SubmitAnswerSerializer
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.enums import InterviewSessionType
from interviews.models import InterviewTurn
from interviews.services import (
  SubmitAnswerAndGenerateFollowupService,
  SubmitAnswerForFullProcessService,
  get_interview_session_for_user,
)
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response


@extend_schema(tags=["면접"])
class SubmitAnswerView(BaseAPIView):
  serializer_class = SubmitAnswerSerializer
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="답변 제출")
  def post(self, request, session_uuid, turn_pk):
    interview_session = get_interview_session_for_user(session_uuid, self.current_user)
    interview_turn = get_object_or_404(InterviewTurn, pk=turn_pk, interview_session=interview_session)

    serializer = SubmitAnswerSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    answer = serializer.validated_data["answer"]

    if interview_session.interview_session_type == InterviewSessionType.FOLLOWUP:
      result = SubmitAnswerAndGenerateFollowupService(
        interview_session=interview_session, interview_turn=interview_turn, answer=answer
      ).perform()

      return Response(
        InterviewTurnSerializer(result, many=True).data,
        status=status.HTTP_201_CREATED,
      )
    else:
      next_turn = SubmitAnswerForFullProcessService(
        interview_session=interview_session, interview_turn=interview_turn, answer=answer
      ).perform()

      if next_turn is None:
        return Response({"detail": "모든 질문에 답변하였습니다."}, status=status.HTTP_200_OK)

      return Response(InterviewTurnSerializer(next_turn).data, status=status.HTTP_200_OK)
