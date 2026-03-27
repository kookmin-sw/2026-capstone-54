"""
Django Static/Media Files Settings
"""

from .common import BASE_DIR, env

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

# ============================================================================
# TEMPORARY: WhiteNoise for local file serving (S3 설정 전까지 임시 사용)
# ============================================================================
# STORAGES = {
#   "default": {
#     "BACKEND": "django.core.files.storage.FileSystemStorage",
#   },
#   "staticfiles": {
#     "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
#   },
# }

# ============================================================================
# TODO: S3 설정 - 아래 주석을 해제하고 위의 STORAGES를 주석 처리
# ============================================================================
# CloudFront 없이 S3 직접 접근 방식 사용
# EC2 IAM Role로 자격증명을 자동 처리하므로 ACCESS_KEY 설정 불필요
AWS_STORAGE_BUCKET_NAME = "pj-kmucd1-04-mefit-be-files"
AWS_S3_REGION_NAME = env.str("AWS_S3_REGION_NAME", default="us-east-1")
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None
AWS_S3_OBJECT_PARAMETERS = {
  "CacheControl": "max-age=86400",
}

# presigned URL 방식: S3 파일을 직접 노출하지 않고 만료 URL로 반환
# CloudFront 없이도 안전하게 파일 접근 가능
AWS_QUERYSTRING_AUTH = True
AWS_QUERYSTRING_EXPIRE = 3600  # presigned URL 유효시간 (초)

STORAGES = {
  "default": {
    # 미디어 파일 (이력서, 면접 녹화, TTS 오디오 등)
    "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    "OPTIONS": {
      "bucket_name": AWS_STORAGE_BUCKET_NAME,
      "region_name": AWS_S3_REGION_NAME,
      "location": "media",
      "file_overwrite": False,
      "querystring_auth": True,
      "querystring_expire": AWS_QUERYSTRING_EXPIRE,
    },
  },
  "staticfiles": {
    # 정적 파일: collectstatic 시 S3에 업로드
    "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    "OPTIONS": {
      "bucket_name": AWS_STORAGE_BUCKET_NAME,
      "region_name": AWS_S3_REGION_NAME,
      "location": "static",
      "file_overwrite": True,
      "querystring_auth": False,  # 정적 파일은 공개 접근
    },
  },
}

STATIC_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com/static/"
MEDIA_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com/media/"

__all__ = [
  "STATIC_URL",
  "STORAGES",
  "MEDIA_URL",
]
