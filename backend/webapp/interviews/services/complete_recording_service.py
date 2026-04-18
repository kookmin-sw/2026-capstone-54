from common.exceptions import ConflictException, PermissionDeniedException
from common.services import BaseService
from interviews.enums import RecordingStatus

from .get_s3_client import get_video_s3_client


class CompleteRecordingService(BaseService):
  """S3 멀티파트 업로드를 완료하고 녹화 상태를 COMPLETED로 변경한다."""

  required_value_kwargs = ["recording", "parts", "end_timestamp", "duration_ms"]

  def validate(self):
    recording = self.kwargs["recording"]
    if recording.status not in (
      RecordingStatus.INITIATED,
      RecordingStatus.UPLOADING,
    ):
      raise ConflictException("완료할 수 없는 녹화 상태입니다.")

    if self.user is not None and recording.user != self.user:
      raise PermissionDeniedException("본인의 녹화만 완료할 수 있습니다.")

  def execute(self):
    recording = self.kwargs["recording"]
    parts = self.kwargs["parts"]
    end_timestamp = self.kwargs["end_timestamp"]
    duration_ms = self.kwargs["duration_ms"]

    s3 = get_video_s3_client()
    s3.complete_multipart_upload(
      Bucket=recording.s3_bucket,
      Key=recording.s3_key,
      UploadId=recording.upload_id,
      MultipartUpload={
        "Parts": [{
          "PartNumber": p["partNumber"],
          "ETag": p["etag"]
        } for p in parts],
      },
    )

    recording.status = RecordingStatus.COMPLETED
    recording.end_timestamp = end_timestamp
    recording.duration_ms = duration_ms
    recording.save(update_fields=["status", "end_timestamp", "duration_ms"])

    return recording
