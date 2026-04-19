from common.exceptions import PermissionDeniedException
from common.services import BaseQueryService
from django.conf import settings

from .get_s3_client import get_video_s3_presign_client


class GeneratePlaybackUrlService(BaseQueryService):
  """녹화 파일의 S3 presigned GET URL을 생성한다."""

  required_value_kwargs = ["recording"]

  def validate(self):
    recording = self.kwargs["recording"]

    if recording.user != self.user:
      raise PermissionDeniedException("본인의 녹화만 조회할 수 있습니다.")

  def execute(self):
    recording = self.kwargs["recording"]
    s3 = get_video_s3_presign_client()
    expiry = settings.VIDEO_PRESIGNED_URL_EXPIRY

    url = s3.generate_presigned_url(
      "get_object",
      Params={
        "Bucket": recording.s3_bucket,
        "Key": recording.s3_key
      },
      ExpiresIn=expiry,
    )

    scaled_url = None
    if recording.scaled_video_key:
      scaled_url = s3.generate_presigned_url(
        "get_object",
        Params={
          "Bucket": settings.SCALED_VIDEO_S3_BUCKET,
          "Key": recording.scaled_video_key,
        },
        ExpiresIn=expiry,
      )

    audio_url = None
    if recording.audio_key:
      audio_url = s3.generate_presigned_url(
        "get_object",
        Params={
          "Bucket": settings.AUDIO_S3_BUCKET,
          "Key": recording.audio_key
        },
        ExpiresIn=expiry,
      )

    return {
      "url": url,
      "scaledUrl": scaled_url,
      "audioUrl": audio_url,
      "mediaType": recording.media_type,
      "expiresIn": expiry,
    }
