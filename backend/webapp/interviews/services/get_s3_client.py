import boto3
from botocore.config import Config
from django.conf import settings

_PATH_STYLE = Config(s3={"addressing_style": "path"})
_video_s3_client = None


def get_video_s3_client():
  global _video_s3_client
  if _video_s3_client is not None:
    return _video_s3_client

  kwargs = {"region_name": settings.AWS_S3_REGION_NAME}
  endpoint = getattr(settings, "VIDEO_S3_ENDPOINT_URL", None) or getattr(settings, "AWS_S3_ENDPOINT_URL", None)
  if endpoint:
    kwargs["endpoint_url"] = endpoint
    kwargs["aws_access_key_id"] = "dummy"
    kwargs["aws_secret_access_key"] = "dummy"
    kwargs["config"] = _PATH_STYLE

  _video_s3_client = boto3.client("s3", **kwargs)
  return _video_s3_client
