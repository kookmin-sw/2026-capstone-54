from api.v1.interviews.serializers import PresignPartQuerySerializer
from botocore.exceptions import BotoCoreError, ClientError
from common.exceptions import ConflictException, ServiceUnavailableException, ValidationException
from common.permissions import IsEmailVerified
from common.views import BaseAPIView
from drf_spectacular.utils import extend_schema
from interviews.enums import InterviewSessionStatus, RecordingStatus
from interviews.models import InterviewRecording
from interviews.services.get_s3_client import get_video_s3_presign_client
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response


@extend_schema(tags=["면접 녹화"])
class PresignPartView(BaseAPIView):
  permission_classes = [IsEmailVerified]

  @extend_schema(summary="파트 업로드용 Presigned URL 발급")
  def get(self, request, uuid):
    serializer = PresignPartQuerySerializer(data=request.query_params)
    serializer.is_valid(raise_exception=True)
    part_number = serializer.validated_data["part_number"]

    recording = get_object_or_404(InterviewRecording, pk=uuid, user=self.current_user)

    if recording.interview_session.interview_session_status == InterviewSessionStatus.PAUSED:
      raise ValidationException(detail="일시정지된 세션입니다. 재개 후 다시 시도하세요.")

    if recording.status not in (
      RecordingStatus.INITIATED,
      RecordingStatus.UPLOADING,
    ):
      raise ConflictException("업로드 가능한 상태가 아닙니다.")

    try:
      s3 = get_video_s3_presign_client()
      presigned_url = s3.generate_presigned_url(
        "upload_part",
        Params={
          "Bucket": recording.s3_bucket,
          "Key": recording.s3_key,
          "UploadId": recording.upload_id,
          "PartNumber": part_number,
        },
        ExpiresIn=1800,
      )
    except (BotoCoreError, ClientError) as e:
      raise ServiceUnavailableException(f"S3 오류가 발생했습니다: {str(e)}")

    return Response({"presignedUrl": presigned_url, "partNumber": part_number})
