import boto3
from django.conf import settings


def get_video_s3_client():
  kwargs = {"region_name": settings.AWS_S3_REGION_NAME}
  endpoint = settings.VIDEO_S3_ENDPOINT_URL or settings.AWS_S3_ENDPOINT_URL
  if endpoint:
    kwargs["endpoint_url"] = endpoint
    kwargs["aws_access_key_id"] = "dummy"
    kwargs["aws_secret_access_key"] = "dummy"
  return boto3.client("s3", **kwargs)
