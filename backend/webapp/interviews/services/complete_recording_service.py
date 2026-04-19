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
    single_upload = self.kwargs.get("single_upload", False)

    s3 = get_video_s3_client()

    if not single_upload:
      # 클라이언트/테스트에 따라 part_number(backend snake_case) 또는 partNumber(frontend camelCase)로 전달될 수 있다.
      normalized_parts = []
      for p in parts:
        part_number = p.get("part_number") or p.get("partNumber")
        normalized_parts.append({
          "part_number": part_number,
          "etag": p.get("etag") or p.get("ETag"),
        })

      s3.complete_multipart_upload(
        Bucket=recording.s3_bucket,
        Key=recording.s3_key,
        UploadId=recording.upload_id,
        MultipartUpload={
          "Parts": [{
            "PartNumber": p["part_number"],
            "ETag": p["etag"],
          } for p in normalized_parts],
        },
      )
    else:
      try:
        s3.abort_multipart_upload(
          Bucket=recording.s3_bucket,
          Key=recording.s3_key,
          UploadId=recording.upload_id,
        )
      except Exception:
        pass

    recording.status = RecordingStatus.COMPLETED
    recording.end_timestamp = end_timestamp
    recording.duration_ms = duration_ms
    recording.save(update_fields=["status", "end_timestamp", "duration_ms"])

    return recording
