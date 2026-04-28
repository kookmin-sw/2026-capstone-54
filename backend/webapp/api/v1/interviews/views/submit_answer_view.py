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
from interviews.enums import InterviewSessionStatus, InterviewSessionType, TranscriptStatus
from interviews.models import InterviewRecording, InterviewTurn
from interviews.services import (
  SubmitAnswerAndGenerateFollowupService,
  SubmitAnswerForFullProcessService,
  get_interview_session_for_user,
)
from interviews.tasks.transcribe_recording_task import RegisteredTranscribeRecordingTask
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
    answer = serializer.validated_data["answer"]
    speech_segments = serializer.validated_data.get("speech_segments", [])
    fallback_requested = serializer.validated_data.get("fallback_requested", False)
    recording_uuid = serializer.validated_data.get("recording_uuid")

    if fallback_requested:
      if not recording_uuid:
        raise ValidationException(detail="fallback_requested=true 인 경우 recording_uuid 가 필요합니다.")
      recording = get_object_or_404(InterviewRecording, pk=recording_uuid, user=self.current_user)
      if recording.interview_session_id != interview_session.pk:
        raise ValidationException(detail="recording 이 현재 세션에 속하지 않습니다.")
      interview_turn.transcript_status = TranscriptStatus.PENDING
      interview_turn.speech_segments = []
      interview_turn.save(update_fields=["transcript_status", "speech_segments"])
      RegisteredTranscribeRecordingTask.delay(
        recording_uuid=str(recording.pk),
        turn_id=interview_turn.pk,
      )
    elif speech_segments:
      interview_turn.speech_segments = speech_segments
      interview_turn.save(update_fields=["speech_segments"])

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
