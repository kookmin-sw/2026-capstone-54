from botocore.exceptions import BotoCoreError, ClientError
from common.exceptions import ServiceUnavailableException
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
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

    try:
      AbortRecordingService(recording=recording, user=self.current_user).perform()
    except (BotoCoreError, ClientError) as e:
      raise ServiceUnavailableException(f"S3 오류가 발생했습니다: {str(e)}")

    return Response(status=status.HTTP_204_NO_CONTENT)
