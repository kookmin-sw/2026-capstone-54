from datetime import timedelta

from .base import *  # noqa: F401, F403
from .components.common import env  # noqa: F401

ENVIRONMENT = "production"

SIMPLE_JWT = {
  **SIMPLE_JWT,  # noqa: F405
  "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
}

DEBUG = False

# ── django-allow-cidr ──
ALLOWED_CIDR_NETS = ["10.42.0.0/16"]

# ── CORS / CSRF / 보안 설정 ──
CORS_ALLOWED_ORIGINS = [
  # 프론트엔드 로컬 개발 (Vite)
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  # 임시 도메인 (mefit.코드.kr)
  "https://mefit.xn--hy1by51c.kr",
  # TODO: (신건) 서비스 도메인 구매후 아래와 같이 설정 필요
  # "https://mefit.chat",
  # "https://www.mefit.chat",
]

CSRF_TRUSTED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  # 임시 도메인 (mefit.코드.kr)
  "https://mefit.xn--hy1by51c.kr",
  # TODO: (신건) 서비스 도메인 구매후 아래와 같이 설정 필요
  # "https://mefit.chat",
  # "https://www.mefit.chat",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

# K3s Ingress가 TLS를 종료하고 HTTP로 Pod에 전달하므로 SSL_REDIRECT는 False
SECURE_SSL_REDIRECT = False
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# 쿠키 보안
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# 기타 보안 헤더
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "SAMEORIGIN"

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
