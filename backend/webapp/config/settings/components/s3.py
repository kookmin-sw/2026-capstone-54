"""
S3 / 파일 스토리지 공통 설정.

환경변수로 endpoint_url을 주입하면 S3Mock(개발) / 실제 AWS S3(운영) 모두 대응합니다.

  개발: AWS_S3_ENDPOINT_URL=http://mefit-s3mock:9090  (docker-compose 내 S3Mock)
  운영: AWS_S3_ENDPOINT_URL 미설정                    (boto3 기본값 → AWS S3)
"""

from .common import env

AWS_STORAGE_BUCKET_NAME = env.str("AWS_STORAGE_BUCKET_NAME", default="mefit-files")
AWS_S3_REGION_NAME = env.str("AWS_S3_REGION_NAME", default="us-east-1")
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None

# endpoint_url: 개발 환경에서만 설정 (.env에 AWS_S3_ENDPOINT_URL 추가)
# 미설정 시 None → boto3가 실제 AWS S3로 연결
AWS_S3_ENDPOINT_URL = env.str("AWS_S3_ENDPOINT_URL", default="") or None

# 영상·음성 녹화용 S3 엔드포인트 (LocalStack)
# 미설정 시 AWS_S3_ENDPOINT_URL 을 fallback 으로 사용
VIDEO_S3_ENDPOINT_URL = env.str("VIDEO_S3_ENDPOINT_URL", default="") or None

# 브라우저에서 직접 접근할 presigned URL 용 엔드포인트
# 개발: http://localhost:4566 (Docker 포트 포워딩)
# 운영: 미설정 (AWS S3 기본 URL 사용)
VIDEO_S3_PUBLIC_ENDPOINT_URL = (env.str("VIDEO_S3_PUBLIC_ENDPOINT_URL", default="") or None)

# 영상·음성 녹화 관련 S3 버킷
VIDEO_S3_BUCKET = env.str("VIDEO_S3_BUCKET", default="pj-kmucd1-04-mefit-video-files")
SCALED_VIDEO_S3_BUCKET = env.str("SCALED_VIDEO_S3_BUCKET", default="pj-kmucd1-04-mefit-scaled-video-files")
FRAME_S3_BUCKET = env.str("FRAME_S3_BUCKET", default="pj-kmucd1-04-mefit-video-frame-files")
AUDIO_S3_BUCKET = env.str("AUDIO_S3_BUCKET", default="pj-kmucd1-04-mefit-audio-files")
SCALED_AUDIO_S3_BUCKET = env.str("SCALED_AUDIO_S3_BUCKET", default="pj-kmucd1-04-mefit-scaled-audio-files")

# Presigned URL 만료 시간 (초)
VIDEO_PRESIGNED_URL_EXPIRY = env.int("VIDEO_PRESIGNED_URL_EXPIRY", default=3600)

__all__ = [
  "AWS_STORAGE_BUCKET_NAME",
  "AWS_S3_REGION_NAME",
  "AWS_S3_FILE_OVERWRITE",
  "AWS_DEFAULT_ACL",
  "AWS_S3_ENDPOINT_URL",
  "VIDEO_S3_BUCKET",
  "SCALED_VIDEO_S3_BUCKET",
  "FRAME_S3_BUCKET",
  "AUDIO_S3_BUCKET",
  "SCALED_AUDIO_S3_BUCKET",
  "VIDEO_S3_ENDPOINT_URL",
  "VIDEO_S3_PUBLIC_ENDPOINT_URL",
  "VIDEO_PRESIGNED_URL_EXPIRY",
]
