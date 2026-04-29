"""audio 객체를 S3 에서 임시 파일로 다운로드."""

import os
import tempfile

import boto3

from app import config

_S3_CLIENT = None


def get_s3_client():
  """boto3 S3 클라이언트 싱글톤.

  - 개발: S3Mock 사용 시 S3_ENDPOINT_URL + 명시적 키를 환경변수로 주입
  - 운영: 키 / endpoint 모두 미설정 → boto3 default credential chain
    → EC2 Instance Profile (IAM Role) 로 자동 인증. analysis-resume 등
    다른 worker 와 동일 패턴.
  """
  global _S3_CLIENT
  if _S3_CLIENT is not None:
    return _S3_CLIENT

  kwargs = {"region_name": config.S3_REGION_NAME}
  if config.S3_ENDPOINT_URL:
    kwargs["endpoint_url"] = config.S3_ENDPOINT_URL
  if config.S3_ACCESS_KEY_ID:
    kwargs["aws_access_key_id"] = config.S3_ACCESS_KEY_ID
    kwargs["aws_secret_access_key"] = config.S3_SECRET_ACCESS_KEY

  _S3_CLIENT = boto3.client("s3", **kwargs)
  return _S3_CLIENT


def download_audio_to_tempfile(bucket: str, key: str) -> str:
  """S3 의 audio 객체를 임시 파일로 다운로드 후 경로 반환. 호출자가 정리 책임."""
  suffix = os.path.splitext(key)[1] or ".wav"
  fd, temp_path = tempfile.mkstemp(suffix=suffix)
  os.close(fd)
  try:
    get_s3_client().download_file(Bucket=bucket, Key=key, Filename=temp_path)
  except Exception:
    if os.path.exists(temp_path):
      os.remove(temp_path)
    raise
  return temp_path
