import boto3
from botocore.config import Config
from django.conf import settings

_PATH_STYLE = Config(s3={"addressing_style": "path"})


def get_video_s3_client():
  kwargs = {"region_name": settings.AWS_S3_REGION_NAME}
  endpoint = settings.VIDEO_S3_ENDPOINT_URL or settings.AWS_S3_ENDPOINT_URL
  if endpoint:
    kwargs["endpoint_url"] = endpoint
    kwargs["aws_access_key_id"] = "dummy"
    kwargs["aws_secret_access_key"] = "dummy"
    kwargs["config"] = _PATH_STYLE
  return boto3.client("s3", **kwargs)


def get_video_s3_presign_client():
  public_endpoint = settings.VIDEO_S3_PUBLIC_ENDPOINT_URL
  if public_endpoint:
    return boto3.client(
      "s3",
      region_name=settings.AWS_S3_REGION_NAME,
      endpoint_url=public_endpoint,
      aws_access_key_id="dummy",
      aws_secret_access_key="dummy",
      config=_PATH_STYLE,
    )
  return get_video_s3_client()
