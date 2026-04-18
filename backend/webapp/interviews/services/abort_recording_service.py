from common.exceptions import ConflictException, PermissionDeniedException
from common.services import BaseService
from interviews.enums import RecordingStatus

from .get_s3_client import get_video_s3_client


class AbortRecordingService(BaseService):
  """S3 멀티파트 업로드를 중단하고 녹화 상태를 FAILED로 변경한다."""

  required_value_kwargs = ["recording"]

  def validate(self):
    recording = self.kwargs["recording"]
    if self.user is not None and recording.user != self.user:
      raise PermissionDeniedException("본인의 녹화만 취소할 수 있습니다.")
    if recording.status not in (
      RecordingStatus.INITIATED,
      RecordingStatus.UPLOADING,
    ):
      raise ConflictException("업로드 진행 중인 녹화만 취소할 수 있습니다.")

  def execute(self):
    recording = self.kwargs["recording"]

    s3 = get_video_s3_client()
    s3.abort_multipart_upload(
      Bucket=recording.s3_bucket,
      Key=recording.s3_key,
      UploadId=recording.upload_id,
    )

    recording.status = RecordingStatus.FAILED
    recording.save(update_fields=["status"])

    return recording
