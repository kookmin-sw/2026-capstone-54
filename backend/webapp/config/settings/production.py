from datetime import timedelta

from .base import *  # noqa: F401, F403

ENVIRONMENT = "production"

FLOWER_INTERNAL_URL = "http://mefit-production-flower:5555"

SIMPLE_JWT = {
  **SIMPLE_JWT,  # noqa: F405
  "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
}

DEBUG = False

# ── django-allow-cidr ──
ALLOWED_CIDR_NETS = ["10.42.0.0/16"]

# Kubernetes 내부 서비스 호스트 추가
ALLOWED_HOSTS = [
  "mefit-production-api.mefit-backend-production.svc.cluster.local",
  "mefit.kr",
]

# ── CORS / CSRF / 보안 설정 ──
CORS_ALLOWED_ORIGINS = [
  # 프론트엔드 로컬 개발 (Vite)
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://mefit.kr",
  "https://www.mefit.kr",
]

CSRF_TRUSTED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://mefit.kr",
  "https://www.mefit.kr",
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

# S3 기본 설정은 components/s3.py (base.py 경유) 에서 주입
# EC2 IAM Role로 자격증명 자동 처리 → ACCESS_KEY 환경변수 불필요
AWS_STORAGE_BUCKET_NAME = "pj-kmucd1-04-mefit-be-files"  # 운영 버킷 오버라이드
AWS_S3_OBJECT_PARAMETERS = {
  "CacheControl": "max-age=86400",
}
AWS_QUERYSTRING_EXPIRE = 3600  # presigned URL 유효시간 (초)

STORAGES = {
  "default": {
    "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    "OPTIONS": {
      "bucket_name": AWS_STORAGE_BUCKET_NAME,
      "region_name": AWS_S3_REGION_NAME,  # noqa: F405
      "location": "media",
      "file_overwrite": False,
      "querystring_auth": True,
      "querystring_expire": AWS_QUERYSTRING_EXPIRE,
    },
  },
  "staticfiles": {
    "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    "OPTIONS": {
      "bucket_name": AWS_STORAGE_BUCKET_NAME,
      "region_name": AWS_S3_REGION_NAME,  # noqa: F405
      "location": "static",
      "file_overwrite": True,
      "querystring_auth": False,
    },
  },
}

STATIC_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com/static/"  # noqa: F405
MEDIA_URL = f"https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com/media/"  # noqa: F405
