import boto3
from botocore.config import Config
from django.conf import settings

_PATH_STYLE = Config(s3={"addressing_style": "path"})

_s3_client = None
_s3_presign_client = None


def _build_client(endpoint=None):
  kwargs = {"region_name": settings.AWS_S3_REGION_NAME}
  if endpoint:
    kwargs["endpoint_url"] = endpoint
    kwargs["aws_access_key_id"] = "dummy"
    kwargs["aws_secret_access_key"] = "dummy"
    kwargs["config"] = _PATH_STYLE
  return boto3.client("s3", **kwargs)


def get_video_s3_client():
  global _s3_client
  if _s3_client is None:
    endpoint = getattr(settings, "VIDEO_S3_ENDPOINT_URL", None) or getattr(settings, "AWS_S3_ENDPOINT_URL", None)
    _s3_client = _build_client(endpoint)
  return _s3_client


def get_video_s3_presign_client():
  global _s3_presign_client
  if _s3_presign_client is None:
    endpoint = getattr(settings, "VIDEO_S3_PUBLIC_ENDPOINT_URL", None)
    if endpoint:
      _s3_presign_client = _build_client(endpoint)
    else:
      _s3_presign_client = get_video_s3_client()
  return _s3_presign_client
