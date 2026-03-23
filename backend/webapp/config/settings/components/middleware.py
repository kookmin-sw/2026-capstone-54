"""
Django Middleware Settings
"""

MIDDLEWARE = [
  'django.middleware.security.SecurityMiddleware',
  'django.contrib.sessions.middleware.SessionMiddleware',
  'django.middleware.common.CommonMiddleware',
  'django.middleware.csrf.CsrfViewMiddleware',
  'django.contrib.auth.middleware.AuthenticationMiddleware',
  'django.contrib.messages.middleware.MessageMiddleware',
  'django.middleware.clickjacking.XFrameOptionsMiddleware',
  # Correlation ID — 반드시 앞쪽에 위치해야 모든 로그에 ID가 첨부됨
  'django_guid.middleware.GuidMiddleware',
  # Structured logging — request/response 메타데이터 자동 기록
  'django_structlog.middlewares.RequestMiddleware',
  "common.middlewares.CamelCaseMiddleware",
]

__all__ = [
  "MIDDLEWARE",
]
