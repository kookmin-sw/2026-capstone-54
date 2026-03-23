"""
Django Logging Settings

패키지:
- django-guid: 각 요청에 고유한 correlation ID(UUID)를 생성하여 모든 로그에 첨부
- django-structlog: 로그를 구조화(JSON)하여 request_id, user_id, ip 등 메타데이터 자동 포함
  - DEBUG=True  → 컬러 콘솔 출력 (개발 환경)
  - DEBUG=False → JSON 출력 (프로덕션 환경)
"""

import structlog

from .common import DEBUG

# ---------------------------------------------------------------------------
# structlog 프로세서 체인
# ---------------------------------------------------------------------------

_shared_processors = [
  # django-guid의 correlation ID를 로그에 첨부
  structlog.contextvars.merge_contextvars,
  structlog.stdlib.add_logger_name,
  structlog.stdlib.add_log_level,
  structlog.stdlib.PositionalArgumentsFormatter(),
  structlog.processors.TimeStamper(fmt="iso"),
  structlog.processors.StackInfoRenderer(),
]

if DEBUG:
  # 개발: 컬러 콘솔 출력
  _renderer = structlog.dev.ConsoleRenderer(colors=True)
else:
  # 프로덕션: JSON 출력
  _renderer = structlog.processors.JSONRenderer()

structlog.configure(
  processors=_shared_processors + [
    structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
  ],
  logger_factory=structlog.stdlib.LoggerFactory(),
  wrapper_class=structlog.stdlib.BoundLogger,
  cache_logger_on_first_use=True,
)

_formatter_processors = _shared_processors + [
  structlog.processors.ExceptionRenderer(),
  _renderer,
]

# ---------------------------------------------------------------------------
# Django LOGGING 설정
# ---------------------------------------------------------------------------

LOGGING = {
  "version": 1,
  "disable_existing_loggers": False,
  "formatters": {
    "structlog": {
      "()": structlog.stdlib.ProcessorFormatter,
      "processors": _formatter_processors,
    },
  },
  "handlers": {
    "console": {
      "class": "logging.StreamHandler",
      "formatter": "structlog",
    },
  },
  "root": {
    "handlers": ["console"],
    "level": "INFO",
  },
  "loggers": {
    "django": {
      "handlers": ["console"],
      "level": "INFO",
      "propagate": False,
    },
    "django.request": {
      "handlers": ["console"],
      "level": "WARNING",
      "propagate": False,
    },
    "django_guid": {
      "handlers": ["console"],
      "level": "WARNING",
      "propagate": False,
    },
    "django_structlog": {
      "handlers": ["console"],
      "level": "INFO",
      "propagate": False,
    },
    # 프로젝트 앱 로거
    "users": {
      "handlers": ["console"],
      "level": "DEBUG" if DEBUG else "INFO",
      "propagate": False,
    },
    "common": {
      "handlers": ["console"],
      "level": "DEBUG" if DEBUG else "INFO",
      "propagate": False,
    },
    "api": {
      "handlers": ["console"],
      "level": "DEBUG" if DEBUG else "INFO",
      "propagate": False,
    },
  },
}

__all__ = [
  "LOGGING",
]
