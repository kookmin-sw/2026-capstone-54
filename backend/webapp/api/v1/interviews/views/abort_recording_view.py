from api.v1.interviews.views._owner_validation import require_session_owner_from_request
from botocore.exceptions import BotoCoreError, ClientError
from common.exceptions import ServiceUnavailableException, ValidationException
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.enums import InterviewSessionStatus
from interviews.models import InterviewRecording
from interviews.services import AbortRecordingService
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response


@extend_schema(tags=["면접 녹화"])
class AbortRecordingView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="녹화 중단")
  def post(self, request, uuid):
    recording = get_object_or_404(InterviewRecording, pk=uuid, user=self.current_user)
    require_session_owner_from_request(request, recording.interview_session)
    if recording.interview_session.interview_session_status == InterviewSessionStatus.PAUSED:
      raise ValidationException(detail="일시정지된 세션입니다. 재개 후 다시 시도하세요.")

    try:
      AbortRecordingService(recording=recording, user=self.current_user).perform()
    except (BotoCoreError, ClientError) as e:
      raise ServiceUnavailableException(f"S3 오류가 발생했습니다: {str(e)}")

    return Response(status=status.HTTP_204_NO_CONTENT)
