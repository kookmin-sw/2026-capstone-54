from api.v1.interviews.serializers import CompleteRecordingSerializer
from botocore.exceptions import BotoCoreError, ClientError
from common.exceptions import ServiceUnavailableException
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.models import InterviewRecording
from interviews.services import CompleteRecordingService
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response


@extend_schema(tags=["면접 녹화"])
class CompleteRecordingView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="녹화 완료 — 멀티파트 업로드 완료")
  def post(self, request, uuid):
    serializer = CompleteRecordingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    recording = get_object_or_404(InterviewRecording, pk=uuid, user=self.current_user)
    data = serializer.validated_data

    try:
      CompleteRecordingService(
        recording=recording,
        parts=data["parts"],
        end_timestamp=data["end_timestamp"],
        duration_ms=data["duration_ms"],
        user=self.current_user,
      ).perform()
    except (BotoCoreError, ClientError) as e:
      raise ServiceUnavailableException(f"S3 오류가 발생했습니다: {str(e)}")

    return Response(
      {
        "recordingId": recording.pk,
        "status": recording.status
      },
      status=status.HTTP_200_OK,
    )
