"""
Django Development Settings

개발 환경 전용 설정.
nplusone 은 N+1 쿼리 / 불필요한 eager load 를 감지하여 로그 및 Slack 알림을 전송한다.
"""

import logging

from .base import *  # noqa: F401, F403

DEBUG = True
ENVIRONMENT = "development"

FLOWER_INTERNAL_URL = "http://flower:5555"

# ── CORS / CSRF 설정 (개발 환경) ──
CORS_ALLOWED_ORIGINS = [
  # 프론트엔드 로컬 개발 (Vite)
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  # Docker 네트워크 내부
  "http://voice-fe:5173",
]

CSRF_TRUSTED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'  # noqa: F405

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'  # noqa: F405

STORAGES = {
  "default": {
    "BACKEND": "django.core.files.storage.FileSystemStorage",
  },
  "staticfiles": {
    "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
  },
}

# ---------------------------------------------------------------------------
# nplusone — 개발 환경 전용 N+1 쿼리 감지
# ---------------------------------------------------------------------------

INSTALLED_APPS += ["nplusone.ext.django"]  # noqa: F405

MIDDLEWARE = [
  # NPlusOneMiddleware 는 반드시 최상단에 위치해야 한다
  "nplusone.ext.django.NPlusOneMiddleware",
] + MIDDLEWARE  # noqa: F405

NPLUSONE_LOGGER = logging.getLogger("nplusone")
NPLUSONE_LOG_LEVEL = logging.WARN

# N+1 감지 시 Slack 알림 (SLACK_CHANNEL_NPLUSONE 미설정 시 무시됨)
LOGGING["loggers"][
  "nplusone"] = {  # noqa: F405
    "handlers": ["console", "slack_nplusone"],
    "level": "WARN",
    "propagate": False,
  }

LOGGING["handlers"]["slack_nplusone"
                    ] = {  # noqa: F405
                      "()": "common.nplusone_handler.NPlusOneSlackHandler",
                      "level": "WARN",
                    }
