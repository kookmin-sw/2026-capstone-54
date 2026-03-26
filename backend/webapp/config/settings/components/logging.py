"""
Django Logging Settings

패키지:
- django-guid: 각 요청에 고유한 correlation ID(UUID)를 생성하여 모든 로그에 첨부
- django-structlog: 로그를 구조화(JSON)하여 request_id, user_id, ip 등 메타데이터 자동 포함
  - DEBUG=True  → 컬러 콘솔 출력 (개발 환경)
  - DEBUG=False → JSON 출력 (프로덕션 환경)
- drf-api-logger: API 요청/응답을 DB에 기록하고 Django Admin 대시보드에서 조회 가능
  - DRF_API_LOGGER_DATABASE=True 로 DB 기록 활성화
  - DRF_API_LOGGER_EXCLUDE_KEYS 로 민감 필드(password, token 등) 자동 마스킹
  - DRF_API_LOGGER_SLOW_API_ABOVE 로 느린 API(ms 기준) 표시
  - DRF_API_LOGGER_CONTENT_TYPES 로 기록할 Content-Type 지정
  - 큐 기반 배치 삽입(DRF_LOGGER_QUEUE_MAX_SIZE, DRF_LOGGER_INTERVAL)으로 DB 부하 최소화
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

# ---------------------------------------------------------------------------
# DRF API Logger 설정
# ---------------------------------------------------------------------------

# DB에 request/response 기록 (admin 대시보드에서 조회 가능)
DRF_API_LOGGER_DATABASE = True

# logging하는 Content-Type
DRF_API_LOGGER_CONTENT_TYPES = [
  "application/json",
  "application/json; charset=utf-8",
  "application/vnd.api+json",
]

# 민감 필드 자동 마스킹
DRF_API_LOGGER_EXCLUDE_KEYS = ['password', 'password1', 'password2', 'token', 'access', 'refresh', 'secret']

# 200ms 이상 걸리는 API를 slow로 표시
DRF_API_LOGGER_SLOW_API_ABOVE = 200

# URL 저장 형식
DRF_API_LOGGER_PATH_TYPE = 'FULL_PATH'

# 큐 설정 (배치 DB 삽입)
DRF_LOGGER_QUEUE_MAX_SIZE = 50
DRF_LOGGER_INTERVAL = 10

# 응답 바디 크기 제한 (bytes)
DRF_API_LOGGER_MAX_REQUEST_BODY_SIZE = 4096
DRF_API_LOGGER_MAX_RESPONSE_BODY_SIZE = 4096

# admin 패널 로그 제외 (기본값이지만 명시)
DRF_API_LOGGER_SKIP_NAMESPACE = ['admin']

__all__ = [
  "LOGGING",
  "DRF_API_LOGGER_DATABASE",
  "DRF_API_LOGGER_CONTENT_TYPES",
  "DRF_API_LOGGER_EXCLUDE_KEYS",
  "DRF_API_LOGGER_SLOW_API_ABOVE",
  "DRF_API_LOGGER_PATH_TYPE",
  "DRF_LOGGER_QUEUE_MAX_SIZE",
  "DRF_LOGGER_INTERVAL",
  "DRF_API_LOGGER_MAX_REQUEST_BODY_SIZE",
  "DRF_API_LOGGER_MAX_RESPONSE_BODY_SIZE",
  "DRF_API_LOGGER_SKIP_NAMESPACE",
]
