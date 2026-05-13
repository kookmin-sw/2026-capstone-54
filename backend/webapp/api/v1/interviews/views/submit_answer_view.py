"""답변 제출 뷰 — 꼬리질문 생성 또는 다음 질문 반환."""

from api.v1.interviews.serializers import (
  InterviewTurnSerializer,
  SubmitAnswerSerializer,
)
from api.v1.interviews.views._owner_validation import require_session_owner_from_request
from common.exceptions import ValidationException
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.enums import InterviewSessionStatus, InterviewSessionType
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
  def post(self, request, interview_session_uuid, turn_pk):
    interview_session = get_interview_session_for_user(interview_session_uuid, self.current_user)
    require_session_owner_from_request(request, interview_session)
    if interview_session.interview_session_status == InterviewSessionStatus.PAUSED:
      raise ValidationException(detail="일시정지된 세션입니다. 재개 후 다시 시도하세요.")
    interview_turn = get_object_or_404(InterviewTurn, pk=turn_pk, interview_session=interview_session)

    serializer = SubmitAnswerSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    answer = serializer.validated_data.get("answer", "")
    speech_segments = serializer.validated_data.get("speech_segments", [])
    gaze_away_count = serializer.validated_data.get("gaze_away_count", 0)
    head_away_count = serializer.validated_data.get("head_away_count", 0)
    speech_rate_sps = serializer.validated_data.get("speech_rate_sps", None)
    pillar_word_counts = serializer.validated_data.get("pillar_word_counts", {})

    update_fields = []
    if speech_segments:
      interview_turn.speech_segments = speech_segments
      update_fields.append("speech_segments")
    interview_turn.gaze_away_count = gaze_away_count
    interview_turn.head_away_count = head_away_count
    interview_turn.speech_rate_sps = speech_rate_sps
    interview_turn.pillar_word_counts = pillar_word_counts
    update_fields.extend(["gaze_away_count", "head_away_count", "speech_rate_sps", "pillar_word_counts"])
    interview_turn.save(update_fields=update_fields)

    if interview_session.interview_session_type == InterviewSessionType.FOLLOWUP:
      result = SubmitAnswerAndGenerateFollowupService(
        interview_session=interview_session,
        interview_turn=interview_turn,
        answer=answer,
      ).perform()

      return Response(
        {
          "turns": InterviewTurnSerializer(result.turns, many=True).data,
          "followup_exhausted": result.followup_exhausted,
        },
        status=status.HTTP_201_CREATED,
      )
    else:
      next_turn = SubmitAnswerForFullProcessService(
        interview_session=interview_session,
        interview_turn=interview_turn,
        answer=answer,
      ).perform()

      if next_turn is None:
        return Response({"detail": "모든 질문에 답변하였습니다."}, status=status.HTTP_200_OK)

      return Response(InterviewTurnSerializer(next_turn).data, status=status.HTTP_200_OK)
