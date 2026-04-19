from datetime import datetime, timezone

from common.exceptions import ConflictException, PermissionDeniedException
from common.services import BaseService
from django.conf import settings
from interviews.enums import InterviewSessionStatus, RecordingMediaType, RecordingStatus
from interviews.models import InterviewRecording

from .get_s3_client import get_video_s3_client


class InitiateRecordingService(BaseService):
  """면접 녹화를 시작하고 S3 멀티파트 업로드를 초기화한다."""

  required_value_kwargs = [
    "interview_session",
    "interview_turn",
    "media_type",
  ]

  def validate(self):
    session = self.kwargs["interview_session"]

    if session.interview_session_status != InterviewSessionStatus.IN_PROGRESS:
      raise ConflictException("진행 중인 면접만 녹화할 수 있습니다.")

    if session.user != self.user:
      raise PermissionDeniedException("본인의 면접만 녹화할 수 있습니다.")

  def execute(self):
    session = self.kwargs["interview_session"]
    turn = self.kwargs["interview_turn"]
    media_type = self.kwargs["media_type"]

    stale_statuses = (RecordingStatus.INITIATED, RecordingStatus.UPLOADING)
    InterviewRecording.objects.filter(
      interview_turn=turn,
      user=self.user,
      status__in=stale_statuses,
    ).update(status=RecordingStatus.ABANDONED)

    ts = int(datetime.now(tz=timezone.utc).timestamp() * 1000)
    s3_key = f"{session.pk}/{turn.pk}/{ts}.webm"

    s3 = get_video_s3_client()
    bucket = settings.VIDEO_S3_BUCKET

    content_type = ("video/webm" if media_type == RecordingMediaType.VIDEO else "audio/webm")
    response = s3.create_multipart_upload(
      Bucket=bucket,
      Key=s3_key,
      ContentType=content_type,
    )
    upload_id = response["UploadId"]

    recording = InterviewRecording.objects.create(
      interview_session=session,
      interview_turn=turn,
      user=self.user,
      media_type=media_type,
      status=RecordingStatus.INITIATED,
      s3_bucket=bucket,
      s3_key=s3_key,
      upload_id=upload_id,
    )

    return {
      "recordingId": str(recording.pk),
      "uploadId": upload_id,
      "s3Key": s3_key,
    }
