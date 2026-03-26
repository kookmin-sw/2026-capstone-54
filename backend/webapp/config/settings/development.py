"""
Django Development Settings

개발 환경 전용 설정.
nplusone 은 N+1 쿼리 / 불필요한 eager load 를 감지하여 로그 및 Slack 알림을 전송한다.
"""

import logging

from .base import *  # noqa: F401, F403

DEBUG = True
ENVIRONMENT = "development"

STORAGES = {
  **STORAGES,  # noqa: F405
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

WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True
