from api.v1.interviews.serializers import (
  InitiateRecordingResponseSerializer,
  InitiateRecordingSerializer,
)
from api.v1.interviews.views._owner_validation import require_session_owner_from_request
from botocore.exceptions import BotoCoreError, ClientError
from common.exceptions import ServiceUnavailableException, ValidationException
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.enums import InterviewSessionStatus
from interviews.models import InterviewTurn
from interviews.services import InitiateRecordingService, get_interview_session_for_user
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response


@extend_schema(tags=["면접 녹화"])
class InitiateRecordingView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="녹화 시작 — 멀티파트 업로드 초기화")
  def post(self, request, uuid):
    serializer = InitiateRecordingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    interview_session = get_interview_session_for_user(uuid, self.current_user)
    require_session_owner_from_request(request, interview_session)
    if interview_session.interview_session_status == InterviewSessionStatus.PAUSED:
      raise ValidationException(detail="일시정지된 세션입니다. 재개 후 다시 시도하세요.")
    interview_turn = get_object_or_404(
      InterviewTurn,
      pk=serializer.validated_data["turn_id"],
      interview_session=interview_session,
    )

    try:
      result = InitiateRecordingService(
        interview_session=interview_session,
        interview_turn=interview_turn,
        user=self.current_user,
        media_type=serializer.validated_data["media_type"],
      ).perform()
    except (BotoCoreError, ClientError) as e:
      raise ServiceUnavailableException(f"S3 오류가 발생했습니다: {str(e)}")

    return Response(
      InitiateRecordingResponseSerializer(result).data,
      status=status.HTTP_201_CREATED,
    )
