from datetime import timedelta

from .base import *  # noqa: F401, F403

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
